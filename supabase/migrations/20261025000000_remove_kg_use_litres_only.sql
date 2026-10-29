-- ====================================================================
-- GOKUL DAIRY ERP: MIGRATION - REMOVE KG, MEASURE STRICTLY IN LITRES
-- All milk collection and sales are now purely in Litres.
-- ====================================================================

-- 1. UPDATE GET_APPLICABLE_COLLECTION_RATE
-- Matching is done by milk_type, fat_percent and date (strictly in litres)
CREATE OR REPLACE FUNCTION get_applicable_collection_rate(
  p_milk_type milk_type,
  p_quantity_unit quantity_unit DEFAULT 'litre',
  p_fat_percent NUMERIC DEFAULT 0,
  p_business_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  rate_rule_id UUID,
  applied_rate NUMERIC
) AS $$
DECLARE
  v_match_count INTEGER;
  v_min_fat NUMERIC;
  v_max_fat NUMERIC;
  v_rate NUMERIC;
BEGIN
  IF p_fat_percent < 0 THEN
    RAISE EXCEPTION 'INVALID_INPUT: Fat percentage cannot be negative.';
  END IF;

  SELECT COUNT(*) INTO v_match_count
  FROM collection_rate_rules r
  WHERE r.milk_type = p_milk_type
    AND r.quantity_unit = 'litre'
    AND p_fat_percent >= r.fat_min
    AND p_fat_percent <= r.fat_max
    AND r.valid_from <= p_business_date
    AND (r.valid_to IS NULL OR r.valid_to >= p_business_date);

  IF v_match_count = 0 THEN
    SELECT MIN(fat_min), MAX(fat_max), MAX(rate_per_unit)
    INTO v_min_fat, v_max_fat, v_rate
    FROM collection_rate_rules
    WHERE milk_type = p_milk_type
      AND quantity_unit = 'litre'
      AND valid_from <= p_business_date
      AND (valid_to IS NULL OR valid_to >= p_business_date);

    IF v_min_fat IS NOT NULL THEN
      RAISE EXCEPTION 'RATE_NOT_FOUND: Fat % is outside configured range (% - %) for % milk.',
        p_fat_percent, v_min_fat, v_max_fat, p_milk_type;
    ELSE
      RAISE EXCEPTION 'RATE_NOT_FOUND: No rate rule configured for % milk on %.',
        p_milk_type, p_business_date;
    END IF;
  ELSIF v_match_count > 1 THEN
    RAISE EXCEPTION 'MULTIPLE_RATES_FOUND: Ambiguous rate configuration (% matching rules found).', v_match_count;
  END IF;

  RETURN QUERY
  SELECT r.id, r.rate_per_unit
  FROM collection_rate_rules r
  WHERE r.milk_type = p_milk_type
    AND r.quantity_unit = 'litre'
    AND p_fat_percent >= r.fat_min
    AND p_fat_percent <= r.fat_max
    AND r.valid_from <= p_business_date
    AND (r.valid_to IS NULL OR r.valid_to >= p_business_date)
  ORDER BY r.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;


-- 2. UPDATE RECORD_MILK_COLLECTION
-- Always stores in litres
CREATE OR REPLACE FUNCTION record_milk_collection(
  p_farmer_id UUID,
  p_milk_type milk_type,
  p_quantity NUMERIC,
  p_quantity_unit quantity_unit DEFAULT 'litre',
  p_fat_percent NUMERIC DEFAULT 0,
  p_created_by UUID DEFAULT auth.uid()
)
RETURNS JSONB AS $$
DECLARE
  v_user_role user_role;
  v_user_active BOOLEAN;
  v_farmer_active BOOLEAN;
  v_farmer_name TEXT;
  v_shift_info JSONB;
  v_shift milk_shift;
  v_business_date DATE;
  v_rate_rule_id UUID;
  v_applied_rate NUMERIC(12,2);
  v_amount NUMERIC(14,2);
  v_new_record milk_collections;
BEGIN
  IF p_created_by IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED: User session required.';
  END IF;

  SELECT role, is_active INTO v_user_role, v_user_active FROM profiles WHERE id = p_created_by;
  IF NOT FOUND OR v_user_active IS NOT TRUE THEN
    RAISE EXCEPTION 'FORBIDDEN: User account is inactive or not found.';
  END IF;

  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'INVALID_INPUT: Milk quantity must be greater than 0.';
  END IF;
  IF p_fat_percent IS NULL OR p_fat_percent < 0 THEN
    RAISE EXCEPTION 'INVALID_INPUT: Fat percentage cannot be negative.';
  END IF;

  SELECT name, is_active INTO v_farmer_name, v_farmer_active FROM farmers WHERE id = p_farmer_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'INVALID_INPUT: Farmer record not found.';
  END IF;
  IF v_farmer_active IS NOT TRUE THEN
    RAISE EXCEPTION 'INVALID_INPUT: Farmer % is currently deactivated.', v_farmer_name;
  END IF;

  v_shift_info := get_current_shift();
  v_shift := (v_shift_info->>'shift')::milk_shift;
  v_business_date := (v_shift_info->>'business_date')::date;

  SELECT rate_rule_id, applied_rate 
  INTO v_rate_rule_id, v_applied_rate
  FROM get_applicable_collection_rate(p_milk_type, 'litre', p_fat_percent, v_business_date);

  v_amount := ROUND((p_quantity * v_applied_rate)::numeric, 2);

  INSERT INTO milk_collections (
    farmer_id,
    business_date,
    shift,
    milk_type,
    quantity,
    quantity_unit,
    fat_percent,
    rate_rule_id,
    applied_rate,
    amount,
    created_by
  ) VALUES (
    p_farmer_id,
    v_business_date,
    v_shift,
    p_milk_type,
    p_quantity,
    'litre',
    p_fat_percent,
    v_rate_rule_id,
    v_applied_rate,
    v_amount,
    p_created_by
  ) RETURNING * INTO v_new_record;

  RETURN jsonb_build_object(
    'success', true,
    'id', v_new_record.id,
    'farmer_id', v_new_record.farmer_id,
    'farmer_name', v_farmer_name,
    'business_date', v_new_record.business_date,
    'shift', v_new_record.shift,
    'milk_type', v_new_record.milk_type,
    'quantity', v_new_record.quantity,
    'quantity_unit', 'litre',
    'fat_percent', v_new_record.fat_percent,
    'rate_rule_id', v_new_record.rate_rule_id,
    'applied_rate', v_new_record.applied_rate,
    'amount', v_new_record.amount,
    'created_at', v_new_record.created_at
  );
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;


-- 3. UPDATE GET_MILK_STOCK (Pure Litres only, no density conversion)
CREATE OR REPLACE FUNCTION get_milk_stock(
  p_target_date DATE DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_business_date DATE;
  v_shift_info JSONB;
  v_result JSONB;
BEGIN
  v_shift_info := get_current_shift();
  v_business_date := COALESCE(p_target_date, (v_shift_info->>'business_date')::date);

  WITH 
  coll_today AS (
    SELECT
      COALESCE(SUM(CASE WHEN milk_type = 'cow' THEN quantity ELSE 0 END), 0) AS cow_litres,
      COALESCE(SUM(CASE WHEN milk_type = 'buffalo' THEN quantity ELSE 0 END), 0) AS buffalo_litres,
      COALESCE(SUM(CASE WHEN milk_type = 'cow' AND shift = 'morning' THEN quantity ELSE 0 END), 0) AS cow_morning_litres,
      COALESCE(SUM(CASE WHEN milk_type = 'cow' AND shift = 'evening' THEN quantity ELSE 0 END), 0) AS cow_evening_litres,
      COALESCE(SUM(CASE WHEN milk_type = 'buffalo' AND shift = 'morning' THEN quantity ELSE 0 END), 0) AS buffalo_morning_litres,
      COALESCE(SUM(CASE WHEN milk_type = 'buffalo' AND shift = 'evening' THEN quantity ELSE 0 END), 0) AS buffalo_evening_litres
    FROM milk_collections
    WHERE business_date = v_business_date
  ),
  sales_today AS (
    SELECT
      COALESCE(SUM(CASE WHEN milk_type = 'cow' THEN quantity_litres ELSE 0 END), 0) AS cow_sold_litres,
      COALESCE(SUM(CASE WHEN milk_type = 'buffalo' THEN quantity_litres ELSE 0 END), 0) AS buffalo_sold_litres,
      COALESCE(SUM(CASE WHEN milk_type = 'cow' AND shift = 'morning' THEN quantity_litres ELSE 0 END), 0) AS cow_morning_sold,
      COALESCE(SUM(CASE WHEN milk_type = 'cow' AND shift = 'evening' THEN quantity_litres ELSE 0 END), 0) AS cow_evening_sold,
      COALESCE(SUM(CASE WHEN milk_type = 'buffalo' AND shift = 'morning' THEN quantity_litres ELSE 0 END), 0) AS buffalo_morning_sold,
      COALESCE(SUM(CASE WHEN milk_type = 'buffalo' AND shift = 'evening' THEN quantity_litres ELSE 0 END), 0) AS buffalo_evening_sold
    FROM milk_sales
    WHERE business_date = v_business_date
  ),
  coll_all_time AS (
    SELECT
      COALESCE(SUM(CASE WHEN milk_type = 'cow' THEN quantity ELSE 0 END), 0) AS cow_total_collected,
      COALESCE(SUM(CASE WHEN milk_type = 'buffalo' THEN quantity ELSE 0 END), 0) AS buffalo_total_collected
    FROM milk_collections
  ),
  sales_all_time AS (
    SELECT
      COALESCE(SUM(CASE WHEN milk_type = 'cow' THEN quantity_litres ELSE 0 END), 0) AS cow_total_sold,
      COALESCE(SUM(CASE WHEN milk_type = 'buffalo' THEN quantity_litres ELSE 0 END), 0) AS buffalo_total_sold
    FROM milk_sales
  )
  SELECT jsonb_build_object(
    'business_date', v_business_date,
    'cow', jsonb_build_object(
      'collected_litres', c.cow_litres,
      'sold_litres', s.cow_sold_litres,
      'available_litres', ROUND((cat.cow_total_collected - sat.cow_total_sold)::numeric, 3),
      'day_balance_litres', ROUND((c.cow_litres - s.cow_sold_litres)::numeric, 3),
      'morning_collected_litres', c.cow_morning_litres,
      'morning_sold_litres', s.cow_morning_sold,
      'morning_balance_litres', ROUND((c.cow_morning_litres - s.cow_morning_sold)::numeric, 3),
      'evening_collected_litres', c.cow_evening_litres,
      'evening_sold_litres', s.cow_evening_sold,
      'evening_balance_litres', ROUND((c.cow_evening_litres - s.cow_evening_sold)::numeric, 3)
    ),
    'buffalo', jsonb_build_object(
      'collected_litres', c.buffalo_litres,
      'sold_litres', s.buffalo_sold_litres,
      'available_litres', ROUND((cat.buffalo_total_collected - sat.buffalo_total_sold)::numeric, 3),
      'day_balance_litres', ROUND((c.buffalo_litres - s.buffalo_sold_litres)::numeric, 3),
      'morning_collected_litres', c.buffalo_morning_litres,
      'morning_sold_litres', s.buffalo_morning_sold,
      'morning_balance_litres', ROUND((c.buffalo_morning_litres - s.buffalo_morning_sold)::numeric, 3),
      'evening_collected_litres', c.buffalo_evening_litres,
      'evening_sold_litres', s.buffalo_evening_sold,
      'evening_balance_litres', ROUND((c.buffalo_evening_litres - s.buffalo_evening_sold)::numeric, 3)
    ),
    'overall', jsonb_build_object(
      'total_collected_litres', ROUND((c.cow_litres + c.buffalo_litres)::numeric, 3),
      'total_sold_litres', ROUND((s.cow_sold_litres + s.buffalo_sold_litres)::numeric, 3),
      'total_available_litres', ROUND(((cat.cow_total_collected - sat.cow_total_sold) + (cat.buffalo_total_collected - sat.buffalo_total_sold))::numeric, 3),
      'day_balance_litres', ROUND(((c.cow_litres - s.cow_sold_litres) + (c.buffalo_litres - s.buffalo_sold_litres))::numeric, 3)
    )
  ) INTO v_result
  FROM coll_today c, sales_today s, coll_all_time cat, sales_all_time sat;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;


-- 4. UPDATE RECORD_MILK_SALE (Check available stock in litres)
CREATE OR REPLACE FUNCTION record_milk_sale(
  p_customer_id UUID,
  p_milk_type milk_type,
  p_quantity_litres NUMERIC,
  p_created_by UUID DEFAULT auth.uid()
)
RETURNS JSONB AS $$
DECLARE
  v_user_role user_role;
  v_user_active BOOLEAN;
  v_customer_active BOOLEAN;
  v_customer_name TEXT;
  v_shift_info JSONB;
  v_shift milk_shift;
  v_business_date DATE;
  v_sale_rate_id UUID;
  v_applied_rate NUMERIC(12,2);
  v_amount NUMERIC(14,2);
  v_new_record milk_sales;
  v_total_collected NUMERIC(14,3);
  v_total_sold NUMERIC(14,3);
  v_available_stock NUMERIC(14,3);
BEGIN
  IF p_created_by IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED: User session required.';
  END IF;

  SELECT role, is_active INTO v_user_role, v_user_active FROM profiles WHERE id = p_created_by;
  IF NOT FOUND OR v_user_active IS NOT TRUE THEN
    RAISE EXCEPTION 'FORBIDDEN: User account is inactive or not found.';
  END IF;

  IF p_quantity_litres IS NULL OR p_quantity_litres <= 0 THEN
    RAISE EXCEPTION 'INVALID_INPUT: Milk quantity in litres must be strictly greater than 0.';
  END IF;

  SELECT name, is_active INTO v_customer_name, v_customer_active FROM customers WHERE id = p_customer_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'INVALID_INPUT: Customer record not found.';
  END IF;
  IF v_customer_active IS NOT TRUE THEN
    RAISE EXCEPTION 'INVALID_INPUT: Customer % is currently deactivated.', v_customer_name;
  END IF;

  -- Stock check in pure litres
  SELECT COALESCE(SUM(quantity), 0)
  INTO v_total_collected
  FROM milk_collections
  WHERE milk_type = p_milk_type;

  SELECT COALESCE(SUM(quantity_litres), 0)
  INTO v_total_sold
  FROM milk_sales
  WHERE milk_type = p_milk_type;

  v_available_stock := v_total_collected - v_total_sold;

  IF p_quantity_litres > v_available_stock THEN
    RAISE EXCEPTION 'INSUFFICIENT_STOCK: Only % L of % milk available in stock. Cannot sell % L.',
      ROUND(v_available_stock, 3), p_milk_type, p_quantity_litres;
  END IF;

  v_shift_info := get_current_shift();
  v_shift := (v_shift_info->>'shift')::milk_shift;
  v_business_date := (v_shift_info->>'business_date')::date;

  SELECT sale_rate_id, applied_rate 
  INTO v_sale_rate_id, v_applied_rate
  FROM get_applicable_sale_rate(p_milk_type, v_business_date);

  v_amount := ROUND((p_quantity_litres * v_applied_rate)::numeric, 2);

  INSERT INTO milk_sales (
    customer_id,
    business_date,
    shift,
    milk_type,
    quantity_litres,
    sale_rate_id,
    applied_rate,
    amount,
    created_by
  ) VALUES (
    p_customer_id,
    v_business_date,
    v_shift,
    p_milk_type,
    p_quantity_litres,
    v_sale_rate_id,
    v_applied_rate,
    v_amount,
    p_created_by
  ) RETURNING * INTO v_new_record;

  RETURN jsonb_build_object(
    'success', true,
    'id', v_new_record.id,
    'customer_id', v_new_record.customer_id,
    'customer_name', v_customer_name,
    'business_date', v_new_record.business_date,
    'shift', v_new_record.shift,
    'milk_type', v_new_record.milk_type,
    'quantity_litres', v_new_record.quantity_litres,
    'sale_rate_id', v_new_record.sale_rate_id,
    'applied_rate', v_new_record.applied_rate,
    'amount', v_new_record.amount,
    'available_stock_after', ROUND((v_available_stock - p_quantity_litres)::numeric, 3),
    'created_at', v_new_record.created_at
  );
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;


-- 5. UPDATE GET_CURRENT_DAY_DASHBOARD (Pure Litres only, no KG)
CREATE OR REPLACE FUNCTION get_current_day_dashboard(
  p_target_date DATE DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_shift_info JSONB;
  v_business_date DATE;
  v_current_shift milk_shift;
  v_stock JSONB;
  v_result JSONB;
BEGIN
  v_shift_info := get_current_shift();
  v_business_date := COALESCE(p_target_date, (v_shift_info->>'business_date')::date);
  v_current_shift := (v_shift_info->>'shift')::milk_shift;
  v_stock := get_milk_stock(v_business_date);

  WITH 
  morning_coll AS (
    SELECT
      COALESCE(SUM(CASE WHEN milk_type = 'cow' THEN quantity ELSE 0 END), 0) AS cow_litres,
      COALESCE(SUM(CASE WHEN milk_type = 'cow' THEN amount ELSE 0 END), 0) AS cow_amount,
      
      COALESCE(SUM(CASE WHEN milk_type = 'buffalo' THEN quantity ELSE 0 END), 0) AS buffalo_litres,
      COALESCE(SUM(CASE WHEN milk_type = 'buffalo' THEN amount ELSE 0 END), 0) AS buffalo_amount,
      
      COALESCE(SUM(quantity), 0) AS total_litres,
      COALESCE(SUM(amount), 0) AS total_amount,
      COUNT(*) AS tx_count
    FROM milk_collections
    WHERE business_date = v_business_date AND shift = 'morning'
  ),
  evening_coll AS (
    SELECT
      COALESCE(SUM(CASE WHEN milk_type = 'cow' THEN quantity ELSE 0 END), 0) AS cow_litres,
      COALESCE(SUM(CASE WHEN milk_type = 'cow' THEN amount ELSE 0 END), 0) AS cow_amount,
      
      COALESCE(SUM(CASE WHEN milk_type = 'buffalo' THEN quantity ELSE 0 END), 0) AS buffalo_litres,
      COALESCE(SUM(CASE WHEN milk_type = 'buffalo' THEN amount ELSE 0 END), 0) AS buffalo_amount,
      
      COALESCE(SUM(quantity), 0) AS total_litres,
      COALESCE(SUM(amount), 0) AS total_amount,
      COUNT(*) AS tx_count
    FROM milk_collections
    WHERE business_date = v_business_date AND shift = 'evening'
  ),
  morning_sl AS (
    SELECT
      COALESCE(SUM(CASE WHEN milk_type = 'cow' THEN quantity_litres ELSE 0 END), 0) AS cow_litres,
      COALESCE(SUM(CASE WHEN milk_type = 'cow' THEN amount ELSE 0 END), 0) AS cow_amount,
      
      COALESCE(SUM(CASE WHEN milk_type = 'buffalo' THEN quantity_litres ELSE 0 END), 0) AS buffalo_litres,
      COALESCE(SUM(CASE WHEN milk_type = 'buffalo' THEN amount ELSE 0 END), 0) AS buffalo_amount,
      
      COALESCE(SUM(quantity_litres), 0) AS total_litres,
      COALESCE(SUM(amount), 0) AS total_amount,
      COUNT(*) AS tx_count
    FROM milk_sales
    WHERE business_date = v_business_date AND shift = 'morning'
  ),
  evening_sl AS (
    SELECT
      COALESCE(SUM(CASE WHEN milk_type = 'cow' THEN quantity_litres ELSE 0 END), 0) AS cow_litres,
      COALESCE(SUM(CASE WHEN milk_type = 'cow' THEN amount ELSE 0 END), 0) AS cow_amount,
      
      COALESCE(SUM(CASE WHEN milk_type = 'buffalo' THEN quantity_litres ELSE 0 END), 0) AS buffalo_litres,
      COALESCE(SUM(CASE WHEN milk_type = 'buffalo' THEN amount ELSE 0 END), 0) AS buffalo_amount,
      
      COALESCE(SUM(quantity_litres), 0) AS total_litres,
      COALESCE(SUM(amount), 0) AS total_amount,
      COUNT(*) AS tx_count
    FROM milk_sales
    WHERE business_date = v_business_date AND shift = 'evening'
  )
  SELECT jsonb_build_object(
    'business_date', v_business_date,
    'current_shift', v_current_shift,
    'is_shift_active', (v_shift_info->>'is_active')::boolean,
    'stock', v_stock,
    'collection', jsonb_build_object(
      'morning', (SELECT row_to_json(morning_coll) FROM morning_coll),
      'evening', (SELECT row_to_json(evening_coll) FROM evening_coll),
      'day_total', jsonb_build_object(
        'total_litres', (SELECT total_litres FROM morning_coll) + (SELECT total_litres FROM evening_coll),
        'total_amount', (SELECT total_amount FROM morning_coll) + (SELECT total_amount FROM evening_coll),
        'tx_count', (SELECT tx_count FROM morning_coll) + (SELECT tx_count FROM evening_coll)
      )
    ),
    'sales', jsonb_build_object(
      'morning', (SELECT row_to_json(morning_sl) FROM morning_sl),
      'evening', (SELECT row_to_json(evening_sl) FROM evening_sl),
      'day_total', jsonb_build_object(
        'total_litres', (SELECT total_litres FROM morning_sl) + (SELECT total_litres FROM evening_sl),
        'total_amount', (SELECT total_amount FROM morning_sl) + (SELECT total_amount FROM evening_sl),
        'tx_count', (SELECT tx_count FROM morning_sl) + (SELECT tx_count FROM evening_sl)
      )
    )
  ) INTO v_result
  FROM coll_today c, evening_coll ec, morning_sl ms, evening_sl es;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
