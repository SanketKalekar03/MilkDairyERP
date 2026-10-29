-- ====================================================================
-- Initial Seed Data for Dairy System
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Initialize Dairy Settings
INSERT INTO dairy_settings (
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
) ON CONFLICT (is_default) DO NOTHING;

-- 2. Initial Collection Rate Rules (Cow - litre)
INSERT INTO collection_rate_rules (milk_type, quantity_unit, fat_min, fat_max, rate_per_unit, valid_from, valid_to) VALUES
('cow', 'litre', 2.0, 4.0, 36.00, '2026-01-01', NULL),
('cow', 'litre', 4.0, 5.5, 39.50, '2026-01-01', NULL),
('cow', 'litre', 5.5, 8.0, 43.50, '2026-01-01', NULL);

-- 3. Initial Collection Rate Rules (Buffalo - litre)
INSERT INTO collection_rate_rules (milk_type, quantity_unit, fat_min, fat_max, rate_per_unit, valid_from, valid_to) VALUES
('buffalo', 'litre', 4.0, 6.5, 52.00, '2026-01-01', NULL),
('buffalo', 'litre', 6.5, 8.5, 58.50, '2026-01-01', NULL),
('buffalo', 'litre', 8.5, 12.0, 66.00, '2026-01-01', NULL);

-- 6. Initial Selling Rates (Litres only)
INSERT INTO sale_rate_versions (milk_type, rate_per_litre, valid_from, valid_to) VALUES
('cow', 55.00, '2026-01-01', NULL),
('buffalo', 72.00, '2026-01-01', NULL);

-- 7. Initial Sample Farmers
INSERT INTO farmers (name, phone, is_active) VALUES
('Ramesh Patil', '9822012345', true),
('Suresh Deshmukh', '9822023456', true),
('Ananda Shinde', '9822034567', true),
('Balasaheb Kadam', '9822045678', true);

-- 8. Initial Sample Customers
INSERT INTO customers (name, phone, is_active) VALUES
('Hotel Annapurna', '9422011111', true),
('Pooja Sweets & Dairy', '9422022222', true),
('Mahesh Sharma', '9422033333', true),
('Shree Krishna Tea House', '9422044444', true);

-- 9. Seed Admin & Operator Accounts in Supabase Auth
DO $$
DECLARE
  v_admin_id UUID;
  v_operator_id UUID;
  v_proprietor_id UUID;
BEGIN
  -- Admin: admin@dairyerp.com
  SELECT id INTO v_admin_id FROM auth.users WHERE email = 'admin@dairyerp.com';
  IF v_admin_id IS NULL THEN
    v_admin_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES (v_admin_id, '00000000-0000-0000-0000-000000000000'::uuid, 'authenticated', 'authenticated', 'admin@dairyerp.com', crypt('Admin@123456', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Dairy Administrator"}'::jsonb, now(), now());
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), v_admin_id, jsonb_build_object('sub', v_admin_id::text, 'email', 'admin@dairyerp.com'), 'email', v_admin_id::text, now(), now(), now());
  ELSE
    UPDATE auth.users SET encrypted_password = crypt('Admin@123456', gen_salt('bf')), email_confirmed_at = COALESCE(email_confirmed_at, now()), updated_at = now() WHERE id = v_admin_id;
  END IF;

  INSERT INTO public.profiles (id, full_name, role, is_active)
  VALUES (v_admin_id, 'Dairy Administrator', 'admin', true)
  ON CONFLICT (id) DO UPDATE SET role = 'admin', is_active = true, full_name = 'Dairy Administrator';

  -- Operator: operator@dairyerp.com
  SELECT id INTO v_operator_id FROM auth.users WHERE email = 'operator@dairyerp.com';
  IF v_operator_id IS NULL THEN
    v_operator_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES (v_operator_id, '00000000-0000-0000-0000-000000000000'::uuid, 'authenticated', 'authenticated', 'operator@dairyerp.com', crypt('Operator@123456', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Shift Operator"}'::jsonb, now(), now());
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), v_operator_id, jsonb_build_object('sub', v_operator_id::text, 'email', 'operator@dairyerp.com'), 'email', v_operator_id::text, now(), now(), now());
  ELSE
    UPDATE auth.users SET encrypted_password = crypt('Operator@123456', gen_salt('bf')), email_confirmed_at = COALESCE(email_confirmed_at, now()), updated_at = now() WHERE id = v_operator_id;
  END IF;

  INSERT INTO public.profiles (id, full_name, role, is_active)
  VALUES (v_operator_id, 'Shift Operator', 'operator', true)
  ON CONFLICT (id) DO UPDATE SET role = 'operator', is_active = true, full_name = 'Shift Operator';

  -- Proprietor: proprietor@omsai.com
  SELECT id INTO v_proprietor_id FROM auth.users WHERE email = 'proprietor@omsai.com';
  IF v_proprietor_id IS NULL THEN
    v_proprietor_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES (v_proprietor_id, '00000000-0000-0000-0000-000000000000'::uuid, 'authenticated', 'authenticated', 'proprietor@omsai.com', crypt('Admin@123456', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Proprietor Admin"}'::jsonb, now(), now());
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), v_proprietor_id, jsonb_build_object('sub', v_proprietor_id::text, 'email', 'proprietor@omsai.com'), 'email', v_proprietor_id::text, now(), now(), now());
  ELSE
    UPDATE auth.users SET encrypted_password = crypt('Admin@123456', gen_salt('bf')), email_confirmed_at = COALESCE(email_confirmed_at, now()), updated_at = now() WHERE id = v_proprietor_id;
  END IF;

  INSERT INTO public.profiles (id, full_name, role, is_active)
  VALUES (v_proprietor_id, 'Proprietor Admin', 'admin', true)
  ON CONFLICT (id) DO UPDATE SET role = 'admin', is_active = true, full_name = 'Proprietor Admin';
END $$;
