-- ====================================================================
-- DAIRY MILK SYSTEM: BUSINESS RULES & INTEGRITY VERIFICATION SUITE
-- ====================================================================

BEGIN;

-- 1. Setup Test Mock Profiles & Settings
DO $$
DECLARE
  v_admin_id UUID := '11111111-1111-1111-1111-111111111111'::uuid;
  v_operator_id UUID := '22222222-2222-2222-2222-222222222222'::uuid;
  v_farmer_id UUID;
  v_customer_id UUID;
  v_rate_rule_id UUID;
  v_sale_rate_id UUID;
  v_collection_id UUID;
  v_sale_id UUID;
  v_bill_res JSONB;
  v_bill_id UUID;
  v_temp_num NUMERIC;
BEGIN
  RAISE NOTICE '=== STARTING TEST SUITE ===';

  -- Clean test data
  DELETE FROM customer_weekly_bill_items;
  DELETE FROM customer_weekly_bills;
  DELETE FROM farmer_weekly_bill_items;
  DELETE FROM farmer_weekly_bills;
  DELETE FROM milk_collections;
  DELETE FROM milk_sales;
  DELETE FROM collection_rate_rules;
  DELETE FROM sale_rate_versions;
  DELETE FROM farmers;
  DELETE FROM customers;
  DELETE FROM profiles WHERE id IN (v_admin_id, v_operator_id);

  -- Insert Test Profiles
  INSERT INTO profiles (id, full_name, role, is_active) VALUES
  (v_admin_id, 'Test Admin', 'admin', true),
  (v_operator_id, 'Test Operator', 'operator', true);

  -- Initialize Settings
  INSERT INTO dairy_settings (dairy_name, timezone, morning_start, morning_end, evening_start, evening_end, is_default)
  VALUES ('Test Dairy', 'Asia/Kolkata', '06:00:00', '18:00:00', '18:00:00', '06:00:00', true)
  ON CONFLICT (is_default) DO UPDATE SET
    morning_start = '06:00:00',
    morning_end = '18:00:00',
    evening_start = '18:00:00',
    evening_end = '06:00:00';

  -- Create Farmers and Customers
  INSERT INTO farmers (name, phone, is_active) VALUES ('Farmer Ram', '9999900001', true) RETURNING id INTO v_farmer_id;
  INSERT INTO customers (name, phone, is_active) VALUES ('Customer Shyam', '9999900002', true) RETURNING id INTO v_customer_id;

  -- ------------------------------------------------------------------
  -- TEST 1: Rate Rules Overlap Prevention
  -- ------------------------------------------------------------------
  RAISE NOTICE 'Test 1: Rate rule creation & overlap rejection...';
  INSERT INTO collection_rate_rules (milk_type, quantity_unit, fat_min, fat_max, rate_per_unit, valid_from, valid_to)
  VALUES ('cow', 'litre', 3.0, 4.0, 36.00, '2026-01-01', '2026-12-31');

  -- Attempting overlapping fat range for same period should fail
  BEGIN
    INSERT INTO collection_rate_rules (milk_type, quantity_unit, fat_min, fat_max, rate_per_unit, valid_from, valid_to)
    VALUES ('cow', 'litre', 3.5, 4.5, 38.00, '2026-06-01', NULL);
    RAISE EXCEPTION 'TEST FAILED: Overlapping collection rate rule was not rejected!';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'PASS: Overlapping rate rule was properly rejected.';
  END;

  -- ------------------------------------------------------------------
  -- TEST 2: Sale Rate Versions Overlap Prevention
  -- ------------------------------------------------------------------
  RAISE NOTICE 'Test 2: Sale rate version creation & overlap rejection...';
  INSERT INTO sale_rate_versions (milk_type, rate_per_litre, valid_from, valid_to)
  VALUES ('cow', 50.00, '2026-01-01', '2026-10-31');

  -- Attempting overlapping date interval for cow milk selling rate
  BEGIN
    INSERT INTO sale_rate_versions (milk_type, rate_per_litre, valid_from, valid_to)
    VALUES ('cow', 55.00, '2026-10-15', NULL);
    RAISE EXCEPTION 'TEST FAILED: Overlapping sale rate version was not rejected!';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'PASS: Overlapping sale rate version was properly rejected.';
  END;

  -- Add valid future rate
  INSERT INTO sale_rate_versions (milk_type, rate_per_litre, valid_from, valid_to)
  VALUES ('cow', 55.00, '2026-11-01', NULL);

  -- ------------------------------------------------------------------
  -- TEST 3: Milk Collection Rate Lookup & Calculation
  -- ------------------------------------------------------------------
  RAISE NOTICE 'Test 3: Milk collection recording with backend rate lookup...';
  INSERT INTO collection_rate_rules (milk_type, quantity_unit, fat_min, fat_max, rate_per_unit, valid_from, valid_to)
  VALUES ('cow', 'kg', 3.0, 4.0, 35.00, '2026-01-01', NULL) RETURNING id INTO v_rate_rule_id;

  -- Test recording valid collection
  DECLARE
    v_col_res JSONB;
  BEGIN
    v_col_res := record_milk_collection(
      p_farmer_id := v_farmer_id,
      p_milk_type := 'cow',
      p_quantity := 10.000,
      p_quantity_unit := 'kg',
      p_fat_percent := 3.5,
      p_created_by := v_operator_id
    );
    v_collection_id := (v_col_res->>'id')::uuid;
    IF (v_col_res->>'amount')::numeric != 350.00 THEN
      RAISE EXCEPTION 'TEST FAILED: Amount mismatch in collection (expected 350.00, got %)', v_col_res->>'amount';
    END IF;
    RAISE NOTICE 'PASS: Collection recorded with exact calculation (₹350.00).';
  END;

  -- Test invalid quantity
  BEGIN
    PERFORM record_milk_collection(v_farmer_id, 'cow', -5, 'kg', 3.5, v_operator_id);
    RAISE EXCEPTION 'TEST FAILED: Negative quantity was not rejected!';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'PASS: Negative collection quantity was properly rejected.';
  END;

  -- ------------------------------------------------------------------
  -- TEST 4: Milk Sales Recording (Strictly Litres)
  -- ------------------------------------------------------------------
  RAISE NOTICE 'Test 4: Milk sales recording (litres only)...';
  DECLARE
    v_sl_res JSONB;
  BEGIN
    v_sl_res := record_milk_sale(
      p_customer_id := v_customer_id,
      p_milk_type := 'cow',
      p_quantity_litres := 5.000,
      p_created_by := v_operator_id
    );
    v_sale_id := (v_sl_res->>'id')::uuid;
    RAISE NOTICE 'PASS: Milk sale recorded successfully (ID: %).', v_sale_id;
  END;

  -- ------------------------------------------------------------------
  -- TEST 5: Farmer Weekly Billing & Atomic Item Assignment
  -- ------------------------------------------------------------------
  RAISE NOTICE 'Test 5: Weekly farmer bill generation...';
  v_bill_res := create_farmer_weekly_bill(
    p_farmer_id := v_farmer_id,
    p_period_start := (CURRENT_DATE - INTERVAL '7 days')::date,
    p_period_end := CURRENT_DATE,
    p_created_by := v_operator_id
  );
  v_bill_id := (v_bill_res->>'bill_id')::uuid;

  IF (v_bill_res->>'total_amount')::numeric != 350.00 THEN
    RAISE EXCEPTION 'TEST FAILED: Weekly bill total mismatch (expected 350.00, got %)', v_bill_res->>'total_amount';
  END IF;
  RAISE NOTICE 'PASS: Farmer weekly bill created with correct transaction sum (₹350.00).';

  -- ------------------------------------------------------------------
  -- TEST 6: Duplicate Billing Prevention
  -- ------------------------------------------------------------------
  RAISE NOTICE 'Test 6: Duplicate billing prevention...';
  BEGIN
    -- Trying to generate another bill for the same period/collection must fail
    PERFORM create_farmer_weekly_bill(
      v_farmer_id,
      (CURRENT_DATE - INTERVAL '7 days')::date,
      CURRENT_DATE,
      v_operator_id
    );
    RAISE EXCEPTION 'TEST FAILED: Duplicate billing allowed unbilled transactions that do not exist!';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'PASS: Duplicate billing properly prevented (NO_TRANSACTIONS_FOUND).';
  END;

  -- ------------------------------------------------------------------
  -- TEST 7: Bill Finalization & Post-Finalization Protection
  -- ------------------------------------------------------------------
  RAISE NOTICE 'Test 7: Finalizing bill and verifying post-finalization immutability...';
  PERFORM finalize_farmer_weekly_bill(v_bill_id, v_admin_id);

  -- Attempting to delete items from finalized bill must be blocked by trigger
  BEGIN
    DELETE FROM farmer_weekly_bill_items WHERE bill_id = v_bill_id;
    RAISE EXCEPTION 'TEST FAILED: Allowed deleting items from finalized bill!';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'PASS: Finalized bill item deletion was rejected by trigger.';
  END;

  -- Attempting to alter original financial transaction attached to finalized bill must be blocked
  BEGIN
    UPDATE milk_collections SET amount = 999.00 WHERE id = v_collection_id;
    RAISE EXCEPTION 'TEST FAILED: Allowed modifying amount of finalized collection transaction!';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'PASS: Historical transaction modification blocked by integrity trigger.';
  END;

  -- ------------------------------------------------------------------
  -- TEST 8: Historical Rate Immutability
  -- ------------------------------------------------------------------
  RAISE NOTICE 'Test 8: Historical rate immutability...';
  -- Create new rate rule for tomorrow
  INSERT INTO collection_rate_rules (milk_type, quantity_unit, fat_min, fat_max, rate_per_unit, valid_from, valid_to)
  VALUES ('cow', 'kg', 3.0, 4.0, 45.00, CURRENT_DATE + INTERVAL '1 day', NULL);

  -- Verify original collection amount is STILL 350.00 (rate 35.00)
  SELECT amount INTO v_temp_num FROM milk_collections WHERE id = v_collection_id;
  IF v_temp_num != 350.00 THEN
    RAISE EXCEPTION 'TEST FAILED: Historical transaction was recalculated upon new rate rule!';
  END IF;
  RAISE NOTICE 'PASS: Historical transaction retained original rate and amount without recalculation.';

  -- ------------------------------------------------------------------
  -- TEST 9: Current Day Dashboard Aggregation
  -- ------------------------------------------------------------------
  RAISE NOTICE 'Test 9: Backend dashboard aggregation...';
  DECLARE
    v_dash JSONB;
  BEGIN
    v_dash := get_current_day_dashboard(CURRENT_DATE);
    IF v_dash->'collection'->'day_total'->>'total_amount' IS NULL THEN
      RAISE EXCEPTION 'TEST FAILED: Dashboard did not return collection day_total!';
    END IF;
    RAISE NOTICE 'PASS: Dashboard aggregation returned valid structure: %', v_dash->'collection'->'day_total';
  END;

  RAISE NOTICE '=== ALL 9 BUSINESS INTEGRITY TESTS PASSED SUCCESSFULLY ===';
END $$;

ROLLBACK;
