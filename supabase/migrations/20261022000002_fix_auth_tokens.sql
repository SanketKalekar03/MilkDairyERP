-- ====================================================================
-- FIX: SUPABASE AUTH "Database error querying schema"
-- Converts NULL token fields in auth.users to empty strings ''
-- ====================================================================

-- 1. Update standard GoTrue token columns from NULL to empty string ''
UPDATE auth.users
SET 
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change = COALESCE(email_change, ''),
  email_change_token_new = COALESCE(email_change_token_new, '');

-- 2. Update additional optional GoTrue token columns if they exist in schema
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'email_change_token_current'
  ) THEN
    EXECUTE 'UPDATE auth.users SET email_change_token_current = COALESCE(email_change_token_current, '''')';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'reauthentication_token'
  ) THEN
    EXECUTE 'UPDATE auth.users SET reauthentication_token = COALESCE(reauthentication_token, '''')';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'phone_change'
  ) THEN
    EXECUTE 'UPDATE auth.users SET phone_change = COALESCE(phone_change, '''')';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'phone_change_token'
  ) THEN
    EXECUTE 'UPDATE auth.users SET phone_change_token = COALESCE(phone_change_token, '''')';
  END IF;
END $$;
