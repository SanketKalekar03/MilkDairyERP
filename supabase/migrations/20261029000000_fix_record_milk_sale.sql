-- ==============================================================================
-- FIX: record_milk_sale function (Use correct sale_rate_id column)
-- ==============================================================================

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
      ROUND(v_available_stock, 3), p_milk_type, p_quantity_litres;
  END IF;

  v_shift_info := get_current_shift();
  v_shift := (v_shift_info->>'shift')::milk_shift;
  v_business_date := (v_shift_info->>'business_date')::date;

  -- Use sale_rate_id (matching the return table of get_applicable_sale_rate and milk_sales table)
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
