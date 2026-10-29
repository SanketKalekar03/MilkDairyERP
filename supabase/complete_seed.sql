-- ====================================================================
-- GOKUL DAIRY ERP: COMPLETE ALL-IN-ONE SEED SQL SCRIPT
-- Paste and run this ENTIRE script in your Supabase SQL Editor
-- (https://supabase.com/dashboard/project/oyjxlrqqbsouqawjcwgq/sql/new)
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Step 0: Fix any NULL token columns in existing auth.users to prevent "Database error querying schema"
UPDATE auth.users
SET 
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change = COALESCE(email_change, ''),
  email_change_token_new = COALESCE(email_change_token_new, '');

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'email_change_token_current') THEN
    EXECUTE 'UPDATE auth.users SET email_change_token_current = COALESCE(email_change_token_current, '''')';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'reauthentication_token') THEN
    EXECUTE 'UPDATE auth.users SET reauthentication_token = COALESCE(reauthentication_token, '''')';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'phone_change') THEN
    EXECUTE 'UPDATE auth.users SET phone_change = COALESCE(phone_change, '''')';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'phone_change_token') THEN
    EXECUTE 'UPDATE auth.users SET phone_change_token = COALESCE(phone_change_token, '''')';
  END IF;
END $$;

-- --------------------------------------------------------------------
-- 1. SEED AUTH USERS, IDENTITIES & PROFILES
-- --------------------------------------------------------------------
DO $$
DECLARE
  v_admin_id UUID := 'a1111111-1111-1111-1111-111111111111'::uuid;
  v_operator_id UUID := 'b2222222-2222-2222-2222-222222222222'::uuid;
  v_proprietor_id UUID := 'c3333333-3333-3333-3333-333333333333'::uuid;
  v_existing_id UUID;
  has_provider_id boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'auth' AND table_name = 'identities' AND column_name = 'provider_id'
  ) INTO has_provider_id;

  -- A. ADMIN USER: admin@dairyerp.com (Password: Admin@123456)
  SELECT id INTO v_existing_id FROM auth.users WHERE email = 'admin@dairyerp.com';
  IF v_existing_id IS NOT NULL THEN
    v_admin_id := v_existing_id;
    UPDATE auth.users
    SET encrypted_password = crypt('Admin@123456', gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb,
        raw_user_meta_data = '{"full_name":"Dairy Administrator"}'::jsonb,
        confirmation_token = COALESCE(confirmation_token, ''),
        recovery_token = COALESCE(recovery_token, ''),
        email_change = COALESCE(email_change, ''),
        email_change_token_new = COALESCE(email_change_token_new, ''),
        updated_at = now()
    WHERE id = v_admin_id;
  ELSE
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change, email_change_token_new
    ) VALUES (
      v_admin_id, '00000000-0000-0000-0000-000000000000'::uuid, 'authenticated', 'authenticated',
      'admin@dairyerp.com', crypt('Admin@123456', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Dairy Administrator"}'::jsonb, now(), now(),
      '', '', '', ''
    );
  END IF;

  BEGIN
    IF has_provider_id THEN
      EXECUTE '
        INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
        VALUES ($1::text, $2, $3, ''email'', $4::text, now(), now(), now())
        ON CONFLICT (provider, provider_id) DO UPDATE SET identity_data = EXCLUDED.identity_data, updated_at = now()
      ' USING v_admin_id::text, v_admin_id, jsonb_build_object('sub', v_admin_id::text, 'email', 'admin@dairyerp.com'), v_admin_id::text;
    ELSE
      EXECUTE '
        INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
        VALUES ($1::text, $2, $3, ''email'', now(), now(), now())
        ON CONFLICT (provider, id) DO UPDATE SET identity_data = EXCLUDED.identity_data, updated_at = now()
      ' USING v_admin_id::text, v_admin_id, jsonb_build_object('sub', v_admin_id::text, 'email', 'admin@dairyerp.com');
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  INSERT INTO public.profiles (id, full_name, role, is_active)
  VALUES (v_admin_id, 'Dairy Administrator', 'admin', true)
  ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    is_active = true,
    full_name = 'Dairy Administrator';


  -- B. OPERATOR USER: operator@dairyerp.com (Password: Operator@123456)
  SELECT id INTO v_existing_id FROM auth.users WHERE email = 'operator@dairyerp.com';
  IF v_existing_id IS NOT NULL THEN
    v_operator_id := v_existing_id;
    UPDATE auth.users
    SET encrypted_password = crypt('Operator@123456', gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb,
        raw_user_meta_data = '{"full_name":"Shift Operator"}'::jsonb,
        confirmation_token = COALESCE(confirmation_token, ''),
        recovery_token = COALESCE(recovery_token, ''),
        email_change = COALESCE(email_change, ''),
        email_change_token_new = COALESCE(email_change_token_new, ''),
        updated_at = now()
    WHERE id = v_operator_id;
  ELSE
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change, email_change_token_new
    ) VALUES (
      v_operator_id, '00000000-0000-0000-0000-000000000000'::uuid, 'authenticated', 'authenticated',
      'operator@dairyerp.com', crypt('Operator@123456', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Shift Operator"}'::jsonb, now(), now(),
      '', '', '', ''
    );
  END IF;

  BEGIN
    IF has_provider_id THEN
      EXECUTE '
        INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
        VALUES ($1::text, $2, $3, ''email'', $4::text, now(), now(), now())
        ON CONFLICT (provider, provider_id) DO UPDATE SET identity_data = EXCLUDED.identity_data, updated_at = now()
      ' USING v_operator_id::text, v_operator_id, jsonb_build_object('sub', v_operator_id::text, 'email', 'operator@dairyerp.com'), v_operator_id::text;
    ELSE
      EXECUTE '
        INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
        VALUES ($1::text, $2, $3, ''email'', now(), now(), now())
        ON CONFLICT (provider, id) DO UPDATE SET identity_data = EXCLUDED.identity_data, updated_at = now()
      ' USING v_operator_id::text, v_operator_id, jsonb_build_object('sub', v_operator_id::text, 'email', 'operator@dairyerp.com');
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  INSERT INTO public.profiles (id, full_name, role, is_active)
  VALUES (v_operator_id, 'Shift Operator', 'operator', true)
  ON CONFLICT (id) DO UPDATE SET
    role = 'operator',
    is_active = true,
    full_name = 'Shift Operator';


  -- C. PROPRIETOR USER: proprietor@omsai.com (Password: Admin@123456)
  SELECT id INTO v_existing_id FROM auth.users WHERE email = 'proprietor@omsai.com';
  IF v_existing_id IS NOT NULL THEN
    v_proprietor_id := v_existing_id;
    UPDATE auth.users
    SET encrypted_password = crypt('Admin@123456', gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb,
        raw_user_meta_data = '{"full_name":"Proprietor Admin"}'::jsonb,
        confirmation_token = COALESCE(confirmation_token, ''),
        recovery_token = COALESCE(recovery_token, ''),
        email_change = COALESCE(email_change, ''),
        email_change_token_new = COALESCE(email_change_token_new, ''),
        updated_at = now()
    WHERE id = v_proprietor_id;
  ELSE
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change, email_change_token_new
    ) VALUES (
      v_proprietor_id, '00000000-0000-0000-0000-000000000000'::uuid, 'authenticated', 'authenticated',
      'proprietor@omsai.com', crypt('Admin@123456', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Proprietor Admin"}'::jsonb, now(), now(),
      '', '', '', ''
    );
  END IF;

  BEGIN
    IF has_provider_id THEN
      EXECUTE '
        INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
        VALUES ($1::text, $2, $3, ''email'', $4::text, now(), now(), now())
        ON CONFLICT (provider, provider_id) DO UPDATE SET identity_data = EXCLUDED.identity_data, updated_at = now()
      ' USING v_proprietor_id::text, v_proprietor_id, jsonb_build_object('sub', v_proprietor_id::text, 'email', 'proprietor@omsai.com'), v_proprietor_id::text;
    ELSE
      EXECUTE '
        INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
        VALUES ($1::text, $2, $3, ''email'', now(), now(), now())
        ON CONFLICT (provider, id) DO UPDATE SET identity_data = EXCLUDED.identity_data, updated_at = now()
      ' USING v_proprietor_id::text, v_proprietor_id, jsonb_build_object('sub', v_proprietor_id::text, 'email', 'proprietor@omsai.com');
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  INSERT INTO public.profiles (id, full_name, role, is_active)
  VALUES (v_proprietor_id, 'Proprietor Admin', 'admin', true)
  ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    is_active = true,
    full_name = 'Proprietor Admin';

  RAISE NOTICE 'Users seeded successfully.';
END $$;


-- --------------------------------------------------------------------
-- 2. SEED DAIRY SETTINGS
-- --------------------------------------------------------------------
INSERT INTO public.dairy_settings (
  dairy_name,
  timezone,
  morning_start,
  morning_end,
  evening_start,
  evening_end,
  is_default
) VALUES (
  'Gokul Dairy Cooperative',
  'Asia/Kolkata',
  '06:00:00',
  '18:00:00',
  '18:00:00',
  '06:00:00',
  true
) ON CONFLICT (is_default) DO UPDATE SET
  dairy_name = EXCLUDED.dairy_name,
  timezone = EXCLUDED.timezone,
  morning_start = EXCLUDED.morning_start,
  morning_end = EXCLUDED.morning_end,
  evening_start = EXCLUDED.evening_start,
  evening_end = EXCLUDED.evening_end;

-- Function: get_current_shift (Automatic 6AM - 6PM shift transitions)
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

  IF v_local_time >= v_morning_start AND v_local_time < v_evening_start THEN
    v_shift := 'morning';
    v_is_active := true;
    v_business_date := v_local_timestamp::date;
  ELSE
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

GRANT EXECUTE ON FUNCTION get_current_shift() TO anon, authenticated, service_role;


-- --------------------------------------------------------------------
-- 3. SEED COLLECTION RATE RULES (Cow & Buffalo in Litres)
-- --------------------------------------------------------------------
DELETE FROM public.collection_rate_rules;

INSERT INTO public.collection_rate_rules (milk_type, quantity_unit, fat_min, fat_max, rate_per_unit, valid_from, valid_to) VALUES
-- Cow Milk (litre)
('cow', 'litre', 2.0, 4.0, 36.00, '2026-01-01', NULL),
('cow', 'litre', 4.0, 5.5, 39.50, '2026-01-01', NULL),
('cow', 'litre', 5.5, 8.0, 43.50, '2026-01-01', NULL),

-- Buffalo Milk (litre)
('buffalo', 'litre', 4.0, 6.5, 52.00, '2026-01-01', NULL),
('buffalo', 'litre', 6.5, 8.5, 58.50, '2026-01-01', NULL),
('buffalo', 'litre', 8.5, 12.0, 66.00, '2026-01-01', NULL);


-- --------------------------------------------------------------------
-- 4. SEED SELLING RATE VERSIONS (Cow & Buffalo in Litres)
-- --------------------------------------------------------------------
DELETE FROM public.sale_rate_versions;

INSERT INTO public.sale_rate_versions (milk_type, rate_per_litre, valid_from, valid_to) VALUES
('cow', 55.00, '2026-01-01', NULL),
('buffalo', 72.00, '2026-01-01', NULL);


-- --------------------------------------------------------------------
-- 5. SEED FARMERS & CUSTOMERS
-- --------------------------------------------------------------------
INSERT INTO public.farmers (name, phone, is_active) VALUES
('Ramesh Patil', '9822012345', true),
('Suresh Deshmukh', '9822023456', true),
('Ananda Shinde', '9822034567', true),
('Balasaheb Kadam', '9822045678', true);

INSERT INTO public.customers (name, phone, is_active) VALUES
('Hotel Annapurna', '9422011111', true),
('Pooja Sweets & Dairy', '9422022222', true),
('Mahesh Sharma', '9422033333', true),
('Shree Krishna Tea House', '9422044444', true);
