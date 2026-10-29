-- ====================================================================
-- GOKUL DAIRY ERP: DATABASE FUNCTIONS UPDATE
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/oyjxlrqqbsouqawjcwgq/sql/new
-- ====================================================================

-- 1. UPDATE DAIRY SETTINGS TO 6:00 AM & 6:00 PM
UPDATE public.dairy_settings
SET
  morning_start = '06:00:00'::time,
  morning_end = '18:00:00'::time,
  evening_start = '18:00:00'::time,
  evening_end = '06:00:00'::time,
  updated_at = now()
WHERE is_default = true;

-- Ensure anon can read dairy settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'dairy_settings' AND policyname = 'Dairy settings anon read'
  ) THEN
    CREATE POLICY "Dairy settings anon read" ON public.dairy_settings
      FOR SELECT TO anon
      USING (true);
  END IF;
END $$;


-- 2. UPDATE GET_CURRENT_SHIFT FUNCTION (6 AM - 6 PM 24/7 AUTOMATIC SHIFTS)
CREATE OR REPLACE FUNCTION get_current_shift()
RETURNS JSONB AS $$
DECLARE
  v_settings RECORD;
  v_local_timestamp TIMESTAMPTZ;
  v_local_time TIME;
  v_business_date DATE;
  v_shift milk_shift;
  v_is_active BOOLEAN := true;
  v_morning_start TIME := '06:00:00'::time;
  v_morning_end TIME := '18:00:00'::time;
  v_evening_start TIME := '18:00:00'::time;
  v_evening_end TIME := '06:00:00'::time;
  v_timezone TEXT := 'Asia/Kolkata';
BEGIN
  SELECT * INTO v_settings FROM public.dairy_settings WHERE is_default = true LIMIT 1;
  IF FOUND THEN
    IF v_settings.timezone IS NOT NULL THEN v_timezone := v_settings.timezone; END IF;
    IF v_settings.morning_start IS NOT NULL THEN v_morning_start := v_settings.morning_start; END IF;
    IF v_settings.morning_end IS NOT NULL THEN v_morning_end := v_settings.morning_end; END IF;
    IF v_settings.evening_start IS NOT NULL THEN v_evening_start := v_settings.evening_start; END IF;
    IF v_settings.evening_end IS NOT NULL THEN v_evening_end := v_settings.evening_end; END IF;
  END IF;

  v_local_timestamp := timezone(v_timezone, now());
  v_local_time := v_local_timestamp::time;
  v_business_date := v_local_timestamp::date;

  -- Morning shift: 06:00 to 18:00
  IF v_local_time >= v_morning_start AND v_local_time < v_evening_start THEN
    v_shift := 'morning';
    v_is_active := true;
    v_business_date := v_local_timestamp::date;
  ELSE
    -- Evening shift: 18:00 to 06:00
    v_shift := 'evening';
    v_is_active := true;
    -- If past midnight (between 00:00 and 05:59:59), associate with yesterday's evening shift
    IF v_local_time < v_morning_start THEN
      v_business_date := (v_local_timestamp - INTERVAL '1 day')::date;
    ELSE
      v_business_date := v_local_timestamp::date;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'shift', v_shift,
    'business_date', v_business_date,
    'is_active', v_is_active,
    'local_time', to_char(v_local_time, 'HH24:MI:SS'),
    'timezone', v_timezone,
    'morning_window', concat(to_char(v_morning_start, 'HH24:MI'), ' - ', to_char(v_evening_start, 'HH24:MI')),
    'evening_window', concat(to_char(v_evening_start, 'HH24:MI'), ' - ', to_char(v_morning_start, 'HH24:MI'))
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_current_shift() TO anon, authenticated, service_role;


-- 3. INSTALL GET_MILK_STOCK FUNCTION (PURE LITRES REAL-TIME STOCK BALANCE)
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

GRANT EXECUTE ON FUNCTION get_milk_stock(DATE) TO anon, authenticated, service_role;


-- 4. UPDATE RECORD_MILK_SALE (PURE LITRES INVENTORY VALIDATION)
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

  -- Stock availability validation in pure litres
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
    RAISE EXCEPTION 'INSUFFICIENT_STOCK: Only % L of % milk available in dairy inventory (attempted to sell % L).',
      v_available_stock, p_milk_type, p_quantity_litres;
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
    'applied_rate', v_new_record.applied_rate,
    'amount', v_new_record.amount,
    'created_at', v_new_record.created_at
  );
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION record_milk_sale(UUID, milk_type, NUMERIC, UUID) TO authenticated, service_role;
