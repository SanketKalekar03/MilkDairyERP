-- ====================================================================
-- GOKUL DAIRY ERP: UPDATE SHIFT TIMINGS TO 6:00 AM & 6:00 PM
-- Automatically switches:
-- Morning Shift: 06:00 AM (06:00) to 06:00 PM (18:00)
-- Evening Shift: 06:00 PM (18:00) to 06:00 AM (06:00)
-- ====================================================================

-- 1. Update dairy_settings with 06:00 & 18:00 windows
UPDATE public.dairy_settings
SET
  morning_start = '06:00:00'::time,
  morning_end = '18:00:00'::time,
  evening_start = '18:00:00'::time,
  evening_end = '06:00:00'::time,
  updated_at = now()
WHERE is_default = true;

INSERT INTO public.dairy_settings (
  dairy_name, timezone, morning_start, morning_end, evening_start, evening_end, is_default
)
SELECT 'Gokul Dairy Cooperative', 'Asia/Kolkata', '06:00:00'::time, '18:00:00'::time, '18:00:00'::time, '06:00:00'::time, true
WHERE NOT EXISTS (SELECT 1 FROM public.dairy_settings WHERE is_default = true);

-- 2. Ensure anon can read dairy_settings
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

-- 3. Replace get_current_shift() with 6AM/6PM automatic transition and midnight handling
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
  -- Get active dairy settings if configured
  SELECT * INTO v_settings FROM public.dairy_settings WHERE is_default = true LIMIT 1;
  IF FOUND THEN
    IF v_settings.timezone IS NOT NULL THEN
      v_timezone := v_settings.timezone;
    END IF;
    IF v_settings.morning_start IS NOT NULL THEN
      v_morning_start := v_settings.morning_start;
    END IF;
    IF v_settings.morning_end IS NOT NULL THEN
      v_morning_end := v_settings.morning_end;
    END IF;
    IF v_settings.evening_start IS NOT NULL THEN
      v_evening_start := v_settings.evening_start;
    END IF;
    IF v_settings.evening_end IS NOT NULL THEN
      v_evening_end := v_settings.evening_end;
    END IF;
  END IF;

  -- Convert server time to dairy timezone
  v_local_timestamp := timezone(v_timezone, now());
  v_local_time := v_local_timestamp::time;
  v_business_date := v_local_timestamp::date;

  -- Morning shift: from 06:00:00 up to 18:00:00
  IF v_local_time >= v_morning_start AND v_local_time < v_evening_start THEN
    v_shift := 'morning';
    v_is_active := true;
    v_business_date := v_local_timestamp::date;
  ELSE
    -- Evening shift: from 18:00:00 up to 06:00:00
    v_shift := 'evening';
    v_is_active := true;
    -- If between 00:00:00 and 05:59:59 (past midnight), belongs to previous day's evening shift
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
