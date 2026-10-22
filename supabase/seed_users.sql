-- ====================================================================
-- SEED SCRIPT: CREATE ADMIN & OPERATOR USERS IN SUPABASE AUTH
-- Run this script in your Supabase Project -> SQL Editor
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
DECLARE
  v_admin_id UUID;
  v_operator_id UUID;
  v_proprietor_id UUID;
BEGIN
  -- ==================================================================
  -- 1. ADMIN USER: admin@dairyerp.com / Admin@123456
  -- ==================================================================
  SELECT id INTO v_admin_id FROM auth.users WHERE email = 'admin@dairyerp.com';

  IF v_admin_id IS NULL THEN
    v_admin_id := gen_random_uuid();

    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      v_admin_id,
      '00000000-0000-0000-0000-000000000000'::uuid,
      'authenticated',
      'authenticated',
      'admin@dairyerp.com',
      crypt('Admin@123456', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Dairy Administrator"}'::jsonb,
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      v_admin_id,
      jsonb_build_object('sub', v_admin_id::text, 'email', 'admin@dairyerp.com'),
      'email',
      v_admin_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Update existing user password & confirm email
    UPDATE auth.users
    SET encrypted_password = crypt('Admin@123456', gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        updated_at = now()
    WHERE id = v_admin_id;
  END IF;

  -- Upsert Profile for Admin
  INSERT INTO public.profiles (id, full_name, role, is_active)
  VALUES (v_admin_id, 'Dairy Administrator', 'admin', true)
  ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    is_active = true,
    full_name = 'Dairy Administrator';


  -- ==================================================================
  -- 2. OPERATOR USER: operator@dairyerp.com / Operator@123456
  -- ==================================================================
  SELECT id INTO v_operator_id FROM auth.users WHERE email = 'operator@dairyerp.com';

  IF v_operator_id IS NULL THEN
    v_operator_id := gen_random_uuid();

    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      v_operator_id,
      '00000000-0000-0000-0000-000000000000'::uuid,
      'authenticated',
      'authenticated',
      'operator@dairyerp.com',
      crypt('Operator@123456', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Shift Operator"}'::jsonb,
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      v_operator_id,
      jsonb_build_object('sub', v_operator_id::text, 'email', 'operator@dairyerp.com'),
      'email',
      v_operator_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Update existing user password & confirm email
    UPDATE auth.users
    SET encrypted_password = crypt('Operator@123456', gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        updated_at = now()
    WHERE id = v_operator_id;
  END IF;

  -- Upsert Profile for Operator
  INSERT INTO public.profiles (id, full_name, role, is_active)
  VALUES (v_operator_id, 'Shift Operator', 'operator', true)
  ON CONFLICT (id) DO UPDATE SET
    role = 'operator',
    is_active = true,
    full_name = 'Shift Operator';


  -- ==================================================================
  -- 3. PROPRIETOR USER: proprietor@omsai.com / Admin@123456
  -- ==================================================================
  SELECT id INTO v_proprietor_id FROM auth.users WHERE email = 'proprietor@omsai.com';

  IF v_proprietor_id IS NULL THEN
    v_proprietor_id := gen_random_uuid();

    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      v_proprietor_id,
      '00000000-0000-0000-0000-000000000000'::uuid,
      'authenticated',
      'authenticated',
      'proprietor@omsai.com',
      crypt('Admin@123456', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Proprietor Admin"}'::jsonb,
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      v_proprietor_id,
      jsonb_build_object('sub', v_proprietor_id::text, 'email', 'proprietor@omsai.com'),
      'email',
      v_proprietor_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Confirm email and reset password to Admin@123456
    UPDATE auth.users
    SET encrypted_password = crypt('Admin@123456', gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        updated_at = now()
    WHERE id = v_proprietor_id;
  END IF;

  -- Upsert Profile for Proprietor as Admin
  INSERT INTO public.profiles (id, full_name, role, is_active)
  VALUES (v_proprietor_id, 'Proprietor Admin', 'admin', true)
  ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    is_active = true,
    full_name = 'Proprietor Admin';

  RAISE NOTICE 'Admin, Operator, and Proprietor users seeded and confirmed successfully.';
END $$;
