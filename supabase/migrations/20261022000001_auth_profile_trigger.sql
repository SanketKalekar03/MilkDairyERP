-- ====================================================================
-- Automatic Profile Provisioning for Supabase Auth Users
-- ====================================================================

-- Trigger Function: handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role user_role := 'operator';
  v_admin_count INTEGER;
  v_name TEXT;
BEGIN
  -- Count existing admin profiles
  SELECT COUNT(*) INTO v_admin_count FROM public.profiles WHERE role = 'admin';

  -- If this is the very first user or email indicates admin/proprietor, assign admin role
  IF v_admin_count = 0 OR NEW.email LIKE '%admin%' OR NEW.email LIKE '%proprietor%' THEN
    v_role := 'admin';
  END IF;

  -- Determine display name from metadata or email username
  v_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    initcap(replace(split_part(NEW.email, '@', 1), '.', ' '))
  );

  IF v_name IS NULL OR trim(v_name) = '' THEN
    v_name := 'Dairy Staff';
  END IF;

  INSERT INTO public.profiles (id, full_name, role, is_active)
  VALUES (NEW.id, v_name, v_role, true)
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(NULLIF(public.profiles.full_name, ''), EXCLUDED.full_name),
    is_active = true;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill any existing users in auth.users who do not yet have a profile in public.profiles
DO $$
DECLARE
  r RECORD;
  v_admin_count INTEGER;
  v_role user_role;
  v_name TEXT;
BEGIN
  SELECT COUNT(*) INTO v_admin_count FROM public.profiles WHERE role = 'admin';

  FOR r IN SELECT * FROM auth.users LOOP
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = r.id) THEN
      IF v_admin_count = 0 OR r.email LIKE '%admin%' OR r.email LIKE '%proprietor%' THEN
        v_role := 'admin';
        v_admin_count := v_admin_count + 1;
      ELSE
        v_role := 'operator';
      END IF;

      v_name := COALESCE(
        r.raw_user_meta_data->>'full_name',
        r.raw_user_meta_data->>'name',
        initcap(replace(split_part(r.email, '@', 1), '.', ' '))
      );

      IF v_name IS NULL OR trim(v_name) = '' THEN
        v_name := 'Dairy Staff';
      END IF;

      INSERT INTO public.profiles (id, full_name, role, is_active)
      VALUES (r.id, v_name, v_role, true)
      ON CONFLICT (id) DO NOTHING;
    END IF;
  END LOOP;
END $$;
