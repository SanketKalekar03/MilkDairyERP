-- ====================================================================
-- SEED SCRIPT: CREATE ADMIN & OPERATOR USERS IN SUPABASE AUTH
-- Run this script in your Supabase Project -> SQL Editor
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
DECLARE
  v_admin_id UUID := 'a1111111-1111-1111-1111-111111111111'::uuid;
  v_operator_id UUID := 'b2222222-2222-2222-2222-222222222222'::uuid;
  v_proprietor_id UUID := 'c3333333-3333-3333-3333-333333333333'::uuid;
  v_existing_id UUID;
  has_provider_id boolean;
BEGIN
  -- Check if auth.identities has provider_id column
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'auth' AND table_name = 'identities' AND column_name = 'provider_id'
  ) INTO has_provider_id;

  -- ==================================================================
  -- 1. ADMIN USER: admin@dairyerp.com / Admin@123456
  -- ==================================================================
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
      updated_at,
      confirmation_token,
      recovery_token,
      email_change,
      email_change_token_new
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
      now(),
      '',
      '',
      '',
      ''
    );
  END IF;

  -- Upsert identity for Admin
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
      updated_at,
      confirmation_token,
      recovery_token,
      email_change,
      email_change_token_new
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
      now(),
      '',
      '',
      '',
      ''
    );
  END IF;

  -- Upsert identity for Operator
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
      updated_at,
      confirmation_token,
      recovery_token,
      email_change,
      email_change_token_new
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
      now(),
      '',
      '',
      '',
      ''
    );
  END IF;

  -- Upsert identity for Proprietor
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

  -- Upsert Profile for Proprietor as Admin
  INSERT INTO public.profiles (id, full_name, role, is_active)
  VALUES (v_proprietor_id, 'Proprietor Admin', 'admin', true)
  ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    is_active = true,
    full_name = 'Proprietor Admin';

  RAISE NOTICE 'Admin, Operator, and Proprietor users seeded and confirmed successfully.';
END $$;
