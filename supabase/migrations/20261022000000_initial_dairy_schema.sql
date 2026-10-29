-- ====================================================================
-- Dairy Milk Collection & Sales Management System
-- Database Schema, Functions, Triggers, RLS and Constraints
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. CUSTOM ENUMS
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin', 'operator');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'milk_shift') THEN
    CREATE TYPE milk_shift AS ENUM ('morning', 'evening');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'milk_type') THEN
    CREATE TYPE milk_type AS ENUM ('cow', 'buffalo');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quantity_unit') THEN
    CREATE TYPE quantity_unit AS ENUM ('kg', 'litre');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bill_status') THEN
    CREATE TYPE bill_status AS ENUM ('draft', 'finalized');
  END IF;
END $$;

-- 3. PROFILES TABLE
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'operator',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. DAIRY SETTINGS TABLE
CREATE TABLE IF NOT EXISTS dairy_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dairy_name TEXT NOT NULL DEFAULT 'Dairy Milk Collection & Sales',
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  morning_start TIME NOT NULL DEFAULT '06:00:00',
  morning_end TIME NOT NULL DEFAULT '18:00:00',
  evening_start TIME NOT NULL DEFAULT '18:00:00',
  evening_end TIME NOT NULL DEFAULT '06:00:00',
  is_default BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES profiles(id),
  CONSTRAINT single_dairy_setting_row UNIQUE (is_default)
);

-- 5. FARMERS TABLE
CREATE TABLE IF NOT EXISTS farmers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. COLLECTION RATE RULES TABLE
CREATE TABLE IF NOT EXISTS collection_rate_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milk_type milk_type NOT NULL,
  quantity_unit quantity_unit NOT NULL,
  fat_min NUMERIC(5,2) NOT NULL CHECK (fat_min >= 0),
  fat_max NUMERIC(5,2) NOT NULL CHECK (fat_max > fat_min),
  rate_per_unit NUMERIC(12,2) NOT NULL CHECK (rate_per_unit > 0),
  valid_from DATE NOT NULL,
  valid_to DATE CHECK (valid_to IS NULL OR valid_to >= valid_from),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES profiles(id)
);

-- 8. MILK COLLECTIONS TABLE
CREATE TABLE IF NOT EXISTS milk_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE RESTRICT,
  business_date DATE NOT NULL,
  shift milk_shift NOT NULL,
  milk_type milk_type NOT NULL,
  quantity NUMERIC(12,3) NOT NULL CHECK (quantity > 0),
  quantity_unit quantity_unit NOT NULL,
  fat_percent NUMERIC(5,2) NOT NULL CHECK (fat_percent >= 0),
  rate_rule_id UUID NOT NULL REFERENCES collection_rate_rules(id) ON DELETE RESTRICT,
  applied_rate NUMERIC(12,2) NOT NULL CHECK (applied_rate > 0),
  amount NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. SALE RATE VERSIONS TABLE
CREATE TABLE IF NOT EXISTS sale_rate_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milk_type milk_type NOT NULL,
  rate_per_litre NUMERIC(12,2) NOT NULL CHECK (rate_per_litre > 0),
  valid_from DATE NOT NULL,
  valid_to DATE CHECK (valid_to IS NULL OR valid_to >= valid_from),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES profiles(id)
);

-- 10. MILK SALES TABLE
CREATE TABLE IF NOT EXISTS milk_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  business_date DATE NOT NULL,
  shift milk_shift NOT NULL,
  milk_type milk_type NOT NULL,
  quantity_litres NUMERIC(12,3) NOT NULL CHECK (quantity_litres > 0),
  sale_rate_id UUID NOT NULL REFERENCES sale_rate_versions(id) ON DELETE RESTRICT,
  applied_rate NUMERIC(12,2) NOT NULL CHECK (applied_rate > 0),
  amount NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. FARMER WEEKLY BILLS
CREATE TABLE IF NOT EXISTS farmer_weekly_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE RESTRICT,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL CHECK (period_end >= period_start),
  total_amount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  status bill_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES profiles(id),
  finalized_at TIMESTAMPTZ,
  finalized_by UUID REFERENCES profiles(id)
);

-- 12. FARMER WEEKLY BILL ITEMS
CREATE TABLE IF NOT EXISTS farmer_weekly_bill_items (
  bill_id UUID NOT NULL REFERENCES farmer_weekly_bills(id) ON DELETE CASCADE,
  collection_id UUID NOT NULL UNIQUE REFERENCES milk_collections(id) ON DELETE RESTRICT,
  PRIMARY KEY (bill_id, collection_id)
);

-- 13. CUSTOMER WEEKLY BILLS
CREATE TABLE IF NOT EXISTS customer_weekly_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL CHECK (period_end >= period_start),
  total_amount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  status bill_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES profiles(id),
  finalized_at TIMESTAMPTZ,
  finalized_by UUID REFERENCES profiles(id)
);

-- 14. CUSTOMER WEEKLY BILL ITEMS
CREATE TABLE IF NOT EXISTS customer_weekly_bill_items (
  bill_id UUID NOT NULL REFERENCES customer_weekly_bills(id) ON DELETE CASCADE,
  sale_id UUID NOT NULL UNIQUE REFERENCES milk_sales(id) ON DELETE RESTRICT,
  PRIMARY KEY (bill_id, sale_id)
);

-- ====================================================================
-- INDEXES
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_milk_collections_farmer_id ON milk_collections(farmer_id);
CREATE INDEX IF NOT EXISTS idx_milk_collections_business_date ON milk_collections(business_date);
CREATE INDEX IF NOT EXISTS idx_milk_collections_business_date_shift ON milk_collections(business_date, shift);
CREATE INDEX IF NOT EXISTS idx_milk_collections_farmer_business_date ON milk_collections(farmer_id, business_date);

CREATE INDEX IF NOT EXISTS idx_milk_sales_customer_id ON milk_sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_milk_sales_business_date ON milk_sales(business_date);
CREATE INDEX IF NOT EXISTS idx_milk_sales_business_date_shift ON milk_sales(business_date, shift);
CREATE INDEX IF NOT EXISTS idx_milk_sales_customer_business_date ON milk_sales(customer_id, business_date);

CREATE INDEX IF NOT EXISTS idx_collection_rate_rules_lookup 
  ON collection_rate_rules(milk_type, quantity_unit, valid_from, valid_to, fat_min, fat_max);

CREATE INDEX IF NOT EXISTS idx_sale_rate_versions_lookup 
  ON sale_rate_versions(milk_type, valid_from, valid_to);

CREATE INDEX IF NOT EXISTS idx_farmer_weekly_bills_lookup 
  ON farmer_weekly_bills(farmer_id, period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_customer_weekly_bills_lookup 
  ON customer_weekly_bills(customer_id, period_start, period_end);

-- ====================================================================
-- TRIGGERS & INTEGRITY ENFORCEMENT
-- ====================================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_dairy_settings_updated_at ON dairy_settings;
CREATE TRIGGER trg_dairy_settings_updated_at
  BEFORE UPDATE ON dairy_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_farmers_updated_at ON farmers;
CREATE TRIGGER trg_farmers_updated_at
  BEFORE UPDATE ON farmers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_customers_updated_at ON customers;
CREATE TRIGGER trg_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Profile protection trigger: Operators cannot elevate their role or change others' roles
CREATE OR REPLACE FUNCTION protect_profile_role_elevation()
RETURNS TRIGGER AS $$
DECLARE
  v_caller_role user_role;
BEGIN
  -- If running in service_role / migrations (no auth.uid()), allow
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT role INTO v_caller_role FROM profiles WHERE id = auth.uid();
  
  -- If caller is not admin, reject changing role or is_active
  IF v_caller_role IS DISTINCT FROM 'admin' THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'FORBIDDEN: Operators are not authorized to change user roles.';
    END IF;
    IF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
      RAISE EXCEPTION 'FORBIDDEN: Operators are not authorized to change account status.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_profile_role ON profiles;
CREATE TRIGGER trg_protect_profile_role
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION protect_profile_role_elevation();

-- Bill Finalization Protection Trigger: Prevent modifying or deleting items from finalized bills
CREATE OR REPLACE FUNCTION check_farmer_bill_items_integrity()
RETURNS TRIGGER AS $$
DECLARE
  v_status bill_status;
  v_bill_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_bill_id := OLD.bill_id;
  ELSE
    v_bill_id := NEW.bill_id;
  END IF;

  SELECT status INTO v_status FROM farmer_weekly_bills WHERE id = v_bill_id;
  IF v_status = 'finalized' THEN
    RAISE EXCEPTION 'BILL_FINALIZED: Cannot modify items of a finalized farmer bill.';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_farmer_bill_items_integrity ON farmer_weekly_bill_items;
CREATE TRIGGER trg_farmer_bill_items_integrity
  BEFORE INSERT OR UPDATE OR DELETE ON farmer_weekly_bill_items
  FOR EACH ROW
  EXECUTE FUNCTION check_farmer_bill_items_integrity();

CREATE OR REPLACE FUNCTION check_customer_bill_items_integrity()
RETURNS TRIGGER AS $$
DECLARE
  v_status bill_status;
  v_bill_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_bill_id := OLD.bill_id;
  ELSE
    v_bill_id := NEW.bill_id;
  END IF;

  SELECT status INTO v_status FROM customer_weekly_bills WHERE id = v_bill_id;
  IF v_status = 'finalized' THEN
    RAISE EXCEPTION 'BILL_FINALIZED: Cannot modify items of a finalized customer bill.';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_customer_bill_items_integrity ON customer_weekly_bill_items;
CREATE TRIGGER trg_customer_bill_items_integrity
  BEFORE INSERT OR UPDATE OR DELETE ON customer_weekly_bill_items
  FOR EACH ROW
  EXECUTE FUNCTION check_customer_bill_items_integrity();

-- Historical transaction protection trigger: Prevent editing transactions once billed in finalized bill
CREATE OR REPLACE FUNCTION protect_finalized_milk_collection()
RETURNS TRIGGER AS $$
DECLARE
  v_bill_status bill_status;
BEGIN
  SELECT b.status INTO v_bill_status
  FROM farmer_weekly_bill_items bi
  JOIN farmer_weekly_bills b ON b.id = bi.bill_id
  WHERE bi.collection_id = OLD.id
  LIMIT 1;

  IF v_bill_status = 'finalized' THEN
    IF TG_OP = 'DELETE' THEN
      RAISE EXCEPTION 'TRANSACTION_ALREADY_BILLED: Cannot delete collection transaction attached to a finalized bill.';
    END IF;
    IF NEW.amount != OLD.amount OR NEW.applied_rate != OLD.applied_rate 
       OR NEW.quantity != OLD.quantity OR NEW.fat_percent != OLD.fat_percent
       OR NEW.business_date != OLD.business_date OR NEW.shift != OLD.shift THEN
      RAISE EXCEPTION 'TRANSACTION_ALREADY_BILLED: Cannot alter financial or core attributes of a billed collection.';
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_finalized_milk_collection ON milk_collections;
CREATE TRIGGER trg_protect_finalized_milk_collection
  BEFORE UPDATE OR DELETE ON milk_collections
  FOR EACH ROW
  EXECUTE FUNCTION protect_finalized_milk_collection();

CREATE OR REPLACE FUNCTION protect_finalized_milk_sale()
RETURNS TRIGGER AS $$
DECLARE
  v_bill_status bill_status;
BEGIN
  SELECT b.status INTO v_bill_status
  FROM customer_weekly_bill_items bi
  JOIN customer_weekly_bills b ON b.id = bi.bill_id
  WHERE bi.sale_id = OLD.id
  LIMIT 1;

  IF v_bill_status = 'finalized' THEN
    IF TG_OP = 'DELETE' THEN
      RAISE EXCEPTION 'TRANSACTION_ALREADY_BILLED: Cannot delete sale transaction attached to a finalized bill.';
    END IF;
    IF NEW.amount != OLD.amount OR NEW.applied_rate != OLD.applied_rate 
       OR NEW.quantity_litres != OLD.quantity_litres
       OR NEW.business_date != OLD.business_date OR NEW.shift != OLD.shift THEN
      RAISE EXCEPTION 'TRANSACTION_ALREADY_BILLED: Cannot alter financial or core attributes of a billed sale.';
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_finalized_milk_sale ON milk_sales;
CREATE TRIGGER trg_protect_finalized_milk_sale
  BEFORE UPDATE OR DELETE ON milk_sales
  FOR EACH ROW
  EXECUTE FUNCTION protect_finalized_milk_sale();

-- Overlap prevention trigger for Collection Rate Rules
CREATE OR REPLACE FUNCTION check_collection_rate_rule_overlap()
RETURNS TRIGGER AS $$
DECLARE
  v_overlap_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_overlap_count
  FROM collection_rate_rules r
  WHERE r.id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    AND r.milk_type = NEW.milk_type
    AND r.quantity_unit = NEW.quantity_unit
    -- Fat ranges overlap: (NEW.fat_min < r.fat_max AND NEW.fat_max > r.fat_min)
    AND (NEW.fat_min < r.fat_max AND NEW.fat_max > r.fat_min)
    -- Date intervals overlap
    AND (r.valid_to IS NULL OR r.valid_to >= NEW.valid_from)
    AND (NEW.valid_to IS NULL OR NEW.valid_to >= r.valid_from);

  IF v_overlap_count > 0 THEN
    RAISE EXCEPTION 'MULTIPLE_RATES_FOUND: Overlapping rate rule exists for milk_type %, unit %, fat range %-%, date from %',
      NEW.milk_type, NEW.quantity_unit, NEW.fat_min, NEW.fat_max, NEW.valid_from;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_collection_rate_rule_overlap ON collection_rate_rules;
CREATE TRIGGER trg_collection_rate_rule_overlap
  BEFORE INSERT OR UPDATE ON collection_rate_rules
  FOR EACH ROW
  EXECUTE FUNCTION check_collection_rate_rule_overlap();

-- Overlap prevention trigger for Sale Rate Versions
CREATE OR REPLACE FUNCTION check_sale_rate_version_overlap()
RETURNS TRIGGER AS $$
DECLARE
  v_overlap_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_overlap_count
  FROM sale_rate_versions r
  WHERE r.id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    AND r.milk_type = NEW.milk_type
    -- Date intervals overlap
    AND (r.valid_to IS NULL OR r.valid_to >= NEW.valid_from)
    AND (NEW.valid_to IS NULL OR NEW.valid_to >= r.valid_from);

  IF v_overlap_count > 0 THEN
    RAISE EXCEPTION 'MULTIPLE_RATES_FOUND: Overlapping sale rate version exists for milk_type % from %',
      NEW.milk_type, NEW.valid_from;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sale_rate_version_overlap ON sale_rate_versions;
CREATE TRIGGER trg_sale_rate_version_overlap
  BEFORE INSERT OR UPDATE ON sale_rate_versions
  FOR EACH ROW
  EXECUTE FUNCTION check_sale_rate_version_overlap();

-- ====================================================================
-- BUSINESS LOGIC FUNCTIONS
-- ====================================================================

-- Function: get_current_shift
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
  -- Get active dairy settings
  SELECT * INTO v_settings FROM dairy_settings WHERE is_default = true LIMIT 1;
  IF FOUND THEN
    IF v_settings.timezone IS NOT NULL THEN v_timezone := v_settings.timezone; END IF;
    IF v_settings.morning_start IS NOT NULL THEN v_morning_start := v_settings.morning_start; END IF;
    IF v_settings.morning_end IS NOT NULL THEN v_morning_end := v_settings.morning_end; END IF;
    IF v_settings.evening_start IS NOT NULL THEN v_evening_start := v_settings.evening_start; END IF;
    IF v_settings.evening_end IS NOT NULL THEN v_evening_end := v_settings.evening_end; END IF;
  END IF;

  -- Convert server time to dairy timezone
  v_local_timestamp := timezone(v_timezone, now());
  v_local_time := v_local_timestamp::time;
  v_business_date := v_local_timestamp::date;

  -- Morning Shift: starts at 06:00 and ends at 18:00
  IF v_local_time >= v_morning_start AND v_local_time < v_evening_start THEN
    v_shift := 'morning';
    v_is_active := true;
    v_business_date := v_local_timestamp::date;
  ELSE
    -- Evening Shift: starts at 18:00 and ends at 06:00
    v_shift := 'evening';
    v_is_active := true;
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

-- Function: get_applicable_collection_rate
CREATE OR REPLACE FUNCTION get_applicable_collection_rate(
  p_milk_type milk_type,
  p_quantity_unit quantity_unit,
  p_fat_percent NUMERIC,
  p_business_date DATE
)
RETURNS TABLE (
  rate_rule_id UUID,
  applied_rate NUMERIC
) AS $$
DECLARE
  v_match_count INTEGER;
BEGIN
  IF p_fat_percent < 0 THEN
    RAISE EXCEPTION 'INVALID_INPUT: Fat percentage cannot be negative.';
  END IF;

  SELECT COUNT(*) INTO v_match_count
  FROM collection_rate_rules r
  WHERE r.milk_type = p_milk_type
    AND r.quantity_unit = p_quantity_unit
    AND p_fat_percent >= r.fat_min
    AND p_fat_percent < r.fat_max
    AND r.valid_from <= p_business_date
    AND (r.valid_to IS NULL OR r.valid_to >= p_business_date);

  IF v_match_count = 0 THEN
    RAISE EXCEPTION 'RATE_NOT_FOUND: No applicable collection rate for milk_type %, unit %, fat % on %',
      p_milk_type, p_quantity_unit, p_fat_percent, p_business_date;
  ELSIF v_match_count > 1 THEN
    RAISE EXCEPTION 'MULTIPLE_RATES_FOUND: Ambiguous rate configuration (% matching rules found).', v_match_count;
  END IF;

  RETURN QUERY
  SELECT r.id, r.rate_per_unit
  FROM collection_rate_rules r
  WHERE r.milk_type = p_milk_type
    AND r.quantity_unit = p_quantity_unit
    AND p_fat_percent >= r.fat_min
    AND p_fat_percent < r.fat_max
    AND r.valid_from <= p_business_date
    AND (r.valid_to IS NULL OR r.valid_to >= p_business_date)
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: get_applicable_sale_rate
CREATE OR REPLACE FUNCTION get_applicable_sale_rate(
  p_milk_type milk_type,
  p_business_date DATE
)
RETURNS TABLE (
  sale_rate_id UUID,
  applied_rate NUMERIC
) AS $$
DECLARE
  v_match_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_match_count
  FROM sale_rate_versions r
  WHERE r.milk_type = p_milk_type
    AND r.valid_from <= p_business_date
    AND (r.valid_to IS NULL OR r.valid_to >= p_business_date);

  IF v_match_count = 0 THEN
    RAISE EXCEPTION 'RATE_NOT_FOUND: No applicable selling rate for % milk on %', p_milk_type, p_business_date;
  ELSIF v_match_count > 1 THEN
    RAISE EXCEPTION 'MULTIPLE_RATES_FOUND: Ambiguous selling rate configuration (% matching rules found).', v_match_count;
  END IF;

  RETURN QUERY
  SELECT r.id, r.rate_per_litre
  FROM sale_rate_versions r
  WHERE r.milk_type = p_milk_type
    AND r.valid_from <= p_business_date
    AND (r.valid_to IS NULL OR r.valid_to >= p_business_date)
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: record_milk_collection
CREATE OR REPLACE FUNCTION record_milk_collection(
  p_farmer_id UUID,
  p_milk_type milk_type,
  p_quantity NUMERIC,
  p_quantity_unit quantity_unit,
  p_fat_percent NUMERIC,
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
  -- 1. Authorization check
  IF p_created_by IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED: User session required.';
  END IF;

  SELECT role, is_active INTO v_user_role, v_user_active FROM profiles WHERE id = p_created_by;
  IF NOT FOUND OR v_user_active IS NOT TRUE THEN
    RAISE EXCEPTION 'FORBIDDEN: User account is inactive or not found.';
  END IF;

  -- 2. Input validation
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'INVALID_INPUT: Milk quantity must be strictly greater than 0.';
  END IF;

  IF p_fat_percent IS NULL OR p_fat_percent < 0 THEN
    RAISE EXCEPTION 'INVALID_INPUT: Fat percentage must be 0 or greater.';
  END IF;

  -- 3. Farmer verification
  SELECT name, is_active INTO v_farmer_name, v_farmer_active FROM farmers WHERE id = p_farmer_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'INVALID_INPUT: Farmer record not found.';
  END IF;
  IF v_farmer_active IS NOT TRUE THEN
    RAISE EXCEPTION 'INVALID_INPUT: Farmer % is currently deactivated.', v_farmer_name;
  END IF;

  -- 4. Shift & Business Date determination (Backend authoritative)
  v_shift_info := get_current_shift();
  v_shift := (v_shift_info->>'shift')::milk_shift;
  v_business_date := (v_shift_info->>'business_date')::date;

  -- 5. Rate rule determination
  SELECT rate_rule_id, applied_rate 
  INTO v_rate_rule_id, v_applied_rate
  FROM get_applicable_collection_rate(p_milk_type, p_quantity_unit, p_fat_percent, v_business_date);

  -- 6. Amount calculation (Database authoritative)
  v_amount := ROUND((p_quantity * v_applied_rate)::numeric, 2);

  -- 7. Insert transaction
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
    p_quantity_unit,
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
    'quantity_unit', v_new_record.quantity_unit,
    'fat_percent', v_new_record.fat_percent,
    'rate_rule_id', v_new_record.rate_rule_id,
    'applied_rate', v_new_record.applied_rate,
    'amount', v_new_record.amount,
    'created_at', v_new_record.created_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: record_milk_sale
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
BEGIN
  -- 1. Authorization check
  IF p_created_by IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED: User session required.';
  END IF;

  SELECT role, is_active INTO v_user_role, v_user_active FROM profiles WHERE id = p_created_by;
  IF NOT FOUND OR v_user_active IS NOT TRUE THEN
    RAISE EXCEPTION 'FORBIDDEN: User account is inactive or not found.';
  END IF;

  -- 2. Input validation
  IF p_quantity_litres IS NULL OR p_quantity_litres <= 0 THEN
    RAISE EXCEPTION 'INVALID_INPUT: Milk quantity in litres must be strictly greater than 0.';
  END IF;

  -- 3. Customer verification
  SELECT name, is_active INTO v_customer_name, v_customer_active FROM customers WHERE id = p_customer_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'INVALID_INPUT: Customer record not found.';
  END IF;
  IF v_customer_active IS NOT TRUE THEN
    RAISE EXCEPTION 'INVALID_INPUT: Customer % is currently deactivated.', v_customer_name;
  END IF;

  -- 4. Shift & Business Date determination (Backend authoritative)
  v_shift_info := get_current_shift();
  v_shift := (v_shift_info->>'shift')::milk_shift;
  v_business_date := (v_shift_info->>'business_date')::date;

  -- 5. Rate version determination
  SELECT sale_rate_id, applied_rate 
  INTO v_sale_rate_id, v_applied_rate
  FROM get_applicable_sale_rate(p_milk_type, v_business_date);

  -- 6. Amount calculation (Database authoritative)
  v_amount := ROUND((p_quantity_litres * v_applied_rate)::numeric, 2);

  -- 7. Insert transaction
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
    'created_at', v_new_record.created_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: create_farmer_weekly_bill (Atomic Transaction)
CREATE OR REPLACE FUNCTION create_farmer_weekly_bill(
  p_farmer_id UUID,
  p_period_start DATE,
  p_period_end DATE,
  p_created_by UUID DEFAULT auth.uid()
)
RETURNS JSONB AS $$
DECLARE
  v_farmer_name TEXT;
  v_total_amount NUMERIC(14,2);
  v_new_bill_id UUID;
  v_item_count INTEGER;
BEGIN
  IF p_period_end < p_period_start THEN
    RAISE EXCEPTION 'INVALID_INPUT: Billing period end date must be on or after start date.';
  END IF;

  SELECT name INTO v_farmer_name FROM farmers WHERE id = p_farmer_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'INVALID_INPUT: Farmer record not found.';
  END IF;

  -- Check if eligible unbilled collections exist
  SELECT COUNT(*), COALESCE(SUM(c.amount), 0)
  INTO v_item_count, v_total_amount
  FROM milk_collections c
  WHERE c.farmer_id = p_farmer_id
    AND c.business_date >= p_period_start
    AND c.business_date <= p_period_end
    AND NOT EXISTS (
      SELECT 1 FROM farmer_weekly_bill_items bi WHERE bi.collection_id = c.id
    );

  IF v_item_count = 0 THEN
    RAISE EXCEPTION 'NO_TRANSACTIONS_FOUND: No unbilled collections found for farmer % in the selected period (% to %).',
      v_farmer_name, p_period_start, p_period_end;
  END IF;

  -- Create bill header
  INSERT INTO farmer_weekly_bills (
    farmer_id,
    period_start,
    period_end,
    total_amount,
    status,
    created_by
  ) VALUES (
    p_farmer_id,
    p_period_start,
    p_period_end,
    v_total_amount,
    'draft',
    p_created_by
  ) RETURNING id INTO v_new_bill_id;

  -- Insert bill items atomically
  INSERT INTO farmer_weekly_bill_items (bill_id, collection_id)
  SELECT v_new_bill_id, c.id
  FROM milk_collections c
  WHERE c.farmer_id = p_farmer_id
    AND c.business_date >= p_period_start
    AND c.business_date <= p_period_end
    AND NOT EXISTS (
      SELECT 1 FROM farmer_weekly_bill_items bi WHERE bi.collection_id = c.id
    );

  RETURN jsonb_build_object(
    'success', true,
    'bill_id', v_new_bill_id,
    'farmer_id', p_farmer_id,
    'farmer_name', v_farmer_name,
    'period_start', p_period_start,
    'period_end', p_period_end,
    'item_count', v_item_count,
    'total_amount', v_total_amount,
    'status', 'draft'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: finalize_farmer_weekly_bill (Atomic Transaction)
CREATE OR REPLACE FUNCTION finalize_farmer_weekly_bill(
  p_bill_id UUID,
  p_finalized_by UUID DEFAULT auth.uid()
)
RETURNS JSONB AS $$
DECLARE
  v_bill RECORD;
BEGIN
  SELECT * INTO v_bill 
  FROM farmer_weekly_bills 
  WHERE id = p_bill_id 
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'BILL_NOT_FOUND: Farmer bill does not exist.';
  END IF;

  IF v_bill.status = 'finalized' THEN
    RAISE EXCEPTION 'BILL_ALREADY_FINALIZED: Farmer bill % is already finalized.', p_bill_id;
  END IF;

  UPDATE farmer_weekly_bills
  SET status = 'finalized',
      finalized_at = now(),
      finalized_by = p_finalized_by
  WHERE id = p_bill_id;

  RETURN jsonb_build_object(
    'success', true,
    'bill_id', p_bill_id,
    'status', 'finalized',
    'finalized_at', now(),
    'finalized_by', p_finalized_by
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: create_customer_weekly_bill (Atomic Transaction)
CREATE OR REPLACE FUNCTION create_customer_weekly_bill(
  p_customer_id UUID,
  p_period_start DATE,
  p_period_end DATE,
  p_created_by UUID DEFAULT auth.uid()
)
RETURNS JSONB AS $$
DECLARE
  v_customer_name TEXT;
  v_total_amount NUMERIC(14,2);
  v_new_bill_id UUID;
  v_item_count INTEGER;
BEGIN
  IF p_period_end < p_period_start THEN
    RAISE EXCEPTION 'INVALID_INPUT: Billing period end date must be on or after start date.';
  END IF;

  SELECT name INTO v_customer_name FROM customers WHERE id = p_customer_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'INVALID_INPUT: Customer record not found.';
  END IF;

  -- Check if eligible unbilled sales exist
  SELECT COUNT(*), COALESCE(SUM(s.amount), 0)
  INTO v_item_count, v_total_amount
  FROM milk_sales s
  WHERE s.customer_id = p_customer_id
    AND s.business_date >= p_period_start
    AND s.business_date <= p_period_end
    AND NOT EXISTS (
      SELECT 1 FROM customer_weekly_bill_items bi WHERE bi.sale_id = s.id
    );

  IF v_item_count = 0 THEN
    RAISE EXCEPTION 'NO_TRANSACTIONS_FOUND: No unbilled sales found for customer % in the selected period (% to %).',
      v_customer_name, p_period_start, p_period_end;
  END IF;

  -- Create bill header
  INSERT INTO customer_weekly_bills (
    customer_id,
    period_start,
    period_end,
    total_amount,
    status,
    created_by
  ) VALUES (
    p_customer_id,
    p_period_start,
    p_period_end,
    v_total_amount,
    'draft',
    p_created_by
  ) RETURNING id INTO v_new_bill_id;

  -- Insert bill items atomically
  INSERT INTO customer_weekly_bill_items (bill_id, sale_id)
  SELECT v_new_bill_id, s.id
  FROM milk_sales s
  WHERE s.customer_id = p_customer_id
    AND s.business_date >= p_period_start
    AND s.business_date <= p_period_end
    AND NOT EXISTS (
      SELECT 1 FROM customer_weekly_bill_items bi WHERE bi.sale_id = s.id
    );

  RETURN jsonb_build_object(
    'success', true,
    'bill_id', v_new_bill_id,
    'customer_id', p_customer_id,
    'customer_name', v_customer_name,
    'period_start', p_period_start,
    'period_end', p_period_end,
    'item_count', v_item_count,
    'total_amount', v_total_amount,
    'status', 'draft'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: finalize_customer_weekly_bill (Atomic Transaction)
CREATE OR REPLACE FUNCTION finalize_customer_weekly_bill(
  p_bill_id UUID,
  p_finalized_by UUID DEFAULT auth.uid()
)
RETURNS JSONB AS $$
DECLARE
  v_bill RECORD;
BEGIN
  SELECT * INTO v_bill 
  FROM customer_weekly_bills 
  WHERE id = p_bill_id 
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'BILL_NOT_FOUND: Customer bill does not exist.';
  END IF;

  IF v_bill.status = 'finalized' THEN
    RAISE EXCEPTION 'BILL_ALREADY_FINALIZED: Customer bill % is already finalized.', p_bill_id;
  END IF;

  UPDATE customer_weekly_bills
  SET status = 'finalized',
      finalized_at = now(),
      finalized_by = p_finalized_by
  WHERE id = p_bill_id;

  RETURN jsonb_build_object(
    'success', true,
    'bill_id', p_bill_id,
    'status', 'finalized',
    'finalized_at', now(),
    'finalized_by', p_finalized_by
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: get_current_day_dashboard (Authoritative Backend Aggregation)
CREATE OR REPLACE FUNCTION get_current_day_dashboard(
  p_target_date DATE DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_shift_info JSONB;
  v_business_date DATE;
  v_current_shift milk_shift;
  v_result JSONB;
BEGIN
  v_shift_info := get_current_shift();
  v_business_date := COALESCE(p_target_date, (v_shift_info->>'business_date')::date);
  v_current_shift := (v_shift_info->>'shift')::milk_shift;

  WITH 
  morning_coll AS (
    SELECT
      COALESCE(SUM(CASE WHEN milk_type = 'cow' AND quantity_unit = 'kg' THEN quantity ELSE 0 END), 0) AS cow_kg,
      COALESCE(SUM(CASE WHEN milk_type = 'cow' AND quantity_unit = 'litre' THEN quantity ELSE 0 END), 0) AS cow_litres,
      COALESCE(SUM(CASE WHEN milk_type = 'cow' THEN amount ELSE 0 END), 0) AS cow_amount,
      
      COALESCE(SUM(CASE WHEN milk_type = 'buffalo' AND quantity_unit = 'kg' THEN quantity ELSE 0 END), 0) AS buffalo_kg,
      COALESCE(SUM(CASE WHEN milk_type = 'buffalo' AND quantity_unit = 'litre' THEN quantity ELSE 0 END), 0) AS buffalo_litres,
      COALESCE(SUM(CASE WHEN milk_type = 'buffalo' THEN amount ELSE 0 END), 0) AS buffalo_amount,
      
      COALESCE(SUM(CASE WHEN quantity_unit = 'kg' THEN quantity ELSE 0 END), 0) AS total_kg,
      COALESCE(SUM(CASE WHEN quantity_unit = 'litre' THEN quantity ELSE 0 END), 0) AS total_litres,
      COALESCE(SUM(amount), 0) AS total_amount,
      COUNT(*) AS tx_count
    FROM milk_collections
    WHERE business_date = v_business_date AND shift = 'morning'
  ),
  evening_coll AS (
    SELECT
      COALESCE(SUM(CASE WHEN milk_type = 'cow' AND quantity_unit = 'kg' THEN quantity ELSE 0 END), 0) AS cow_kg,
      COALESCE(SUM(CASE WHEN milk_type = 'cow' AND quantity_unit = 'litre' THEN quantity ELSE 0 END), 0) AS cow_litres,
      COALESCE(SUM(CASE WHEN milk_type = 'cow' THEN amount ELSE 0 END), 0) AS cow_amount,
      
      COALESCE(SUM(CASE WHEN milk_type = 'buffalo' AND quantity_unit = 'kg' THEN quantity ELSE 0 END), 0) AS buffalo_kg,
      COALESCE(SUM(CASE WHEN milk_type = 'buffalo' AND quantity_unit = 'litre' THEN quantity ELSE 0 END), 0) AS buffalo_litres,
      COALESCE(SUM(CASE WHEN milk_type = 'buffalo' THEN amount ELSE 0 END), 0) AS buffalo_amount,
      
      COALESCE(SUM(CASE WHEN quantity_unit = 'kg' THEN quantity ELSE 0 END), 0) AS total_kg,
      COALESCE(SUM(CASE WHEN quantity_unit = 'litre' THEN quantity ELSE 0 END), 0) AS total_litres,
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
    'collection', jsonb_build_object(
      'morning', (SELECT row_to_json(morning_coll) FROM morning_coll),
      'evening', (SELECT row_to_json(evening_coll) FROM evening_coll),
      'day_total', jsonb_build_object(
        'total_kg', (SELECT total_kg FROM morning_coll) + (SELECT total_kg FROM evening_coll),
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
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE dairy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_rate_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_rate_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE milk_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE milk_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmer_weekly_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmer_weekly_bill_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_weekly_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_weekly_bill_items ENABLE ROW LEVEL SECURITY;

-- Helper security functions
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin' AND is_active = true
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_authenticated_user()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND is_active = true
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- PROFILES
DROP POLICY IF EXISTS "Profiles read policy" ON profiles;
CREATE POLICY "Profiles read policy" ON profiles
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Profiles update policy" ON profiles;
CREATE POLICY "Profiles update policy" ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Profiles insert policy" ON profiles;
CREATE POLICY "Profiles insert policy" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (is_admin() OR id = auth.uid());

-- DAIRY SETTINGS
DROP POLICY IF EXISTS "Dairy settings read policy" ON dairy_settings;
CREATE POLICY "Dairy settings read policy" ON dairy_settings
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Dairy settings admin modify" ON dairy_settings;
CREATE POLICY "Dairy settings admin modify" ON dairy_settings
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- FARMERS
DROP POLICY IF EXISTS "Farmers read policy" ON farmers;
CREATE POLICY "Farmers read policy" ON farmers
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Farmers operator/admin write" ON farmers;
CREATE POLICY "Farmers operator/admin write" ON farmers
  FOR ALL TO authenticated
  USING (is_authenticated_user())
  WITH CHECK (is_authenticated_user());

-- CUSTOMERS
DROP POLICY IF EXISTS "Customers read policy" ON customers;
CREATE POLICY "Customers read policy" ON customers
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Customers operator/admin write" ON customers;
CREATE POLICY "Customers operator/admin write" ON customers
  FOR ALL TO authenticated
  USING (is_authenticated_user())
  WITH CHECK (is_authenticated_user());

-- COLLECTION RATES (Admin-only modification)
DROP POLICY IF EXISTS "Collection rates read policy" ON collection_rate_rules;
CREATE POLICY "Collection rates read policy" ON collection_rate_rules
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Collection rates admin write" ON collection_rate_rules;
CREATE POLICY "Collection rates admin write" ON collection_rate_rules
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- SALE RATES (Admin-only modification)
DROP POLICY IF EXISTS "Sale rates read policy" ON sale_rate_versions;
CREATE POLICY "Sale rates read policy" ON sale_rate_versions
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Sale rates admin write" ON sale_rate_versions;
CREATE POLICY "Sale rates admin write" ON sale_rate_versions
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- MILK COLLECTIONS
DROP POLICY IF EXISTS "Milk collections read policy" ON milk_collections;
CREATE POLICY "Milk collections read policy" ON milk_collections
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Milk collections insert policy" ON milk_collections;
CREATE POLICY "Milk collections insert policy" ON milk_collections
  FOR INSERT TO authenticated
  WITH CHECK (is_authenticated_user());

DROP POLICY IF EXISTS "Milk collections admin update" ON milk_collections;
CREATE POLICY "Milk collections admin update" ON milk_collections
  FOR UPDATE TO authenticated
  USING (is_admin());

-- MILK SALES
DROP POLICY IF EXISTS "Milk sales read policy" ON milk_sales;
CREATE POLICY "Milk sales read policy" ON milk_sales
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Milk sales insert policy" ON milk_sales;
CREATE POLICY "Milk sales insert policy" ON milk_sales
  FOR INSERT TO authenticated
  WITH CHECK (is_authenticated_user());

DROP POLICY IF EXISTS "Milk sales admin update" ON milk_sales;
CREATE POLICY "Milk sales admin update" ON milk_sales
  FOR UPDATE TO authenticated
  USING (is_admin());

-- BILLS & BILL ITEMS
DROP POLICY IF EXISTS "Farmer bills read policy" ON farmer_weekly_bills;
CREATE POLICY "Farmer bills read policy" ON farmer_weekly_bills
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Farmer bills modify policy" ON farmer_weekly_bills;
CREATE POLICY "Farmer bills modify policy" ON farmer_weekly_bills
  FOR ALL TO authenticated
  USING (is_authenticated_user())
  WITH CHECK (is_authenticated_user());

DROP POLICY IF EXISTS "Farmer bill items read policy" ON farmer_weekly_bill_items;
CREATE POLICY "Farmer bill items read policy" ON farmer_weekly_bill_items
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Farmer bill items modify policy" ON farmer_weekly_bill_items;
CREATE POLICY "Farmer bill items modify policy" ON farmer_weekly_bill_items
  FOR ALL TO authenticated
  USING (is_authenticated_user())
  WITH CHECK (is_authenticated_user());

DROP POLICY IF EXISTS "Customer bills read policy" ON customer_weekly_bills;
CREATE POLICY "Customer bills read policy" ON customer_weekly_bills
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Customer bills modify policy" ON customer_weekly_bills;
CREATE POLICY "Customer bills modify policy" ON customer_weekly_bills
  FOR ALL TO authenticated
  USING (is_authenticated_user())
  WITH CHECK (is_authenticated_user());

DROP POLICY IF EXISTS "Customer bill items read policy" ON customer_weekly_bill_items;
CREATE POLICY "Customer bill items read policy" ON customer_weekly_bill_items
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Customer bill items modify policy" ON customer_weekly_bill_items;
CREATE POLICY "Customer bill items modify policy" ON customer_weekly_bill_items
  FOR ALL TO authenticated
  USING (is_authenticated_user())
  WITH CHECK (is_authenticated_user());
