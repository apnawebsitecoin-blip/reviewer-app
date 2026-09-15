-- ============================================================
-- Migration: Dynamic check-in bonus trigger
-- Date: 2026-09-15
-- Run this in Supabase Dashboard → SQL Editor
--
-- PURPOSE: Makes the daily check-in reward amount read from
--   site_settings (key = 'checkin_bonus_amount') instead of the
--   hardcoded DEFAULT 5 on the daily_checkins table.
--
-- SAFE TO RE-RUN: Uses CREATE OR REPLACE for the function and
--   DROP TRIGGER IF EXISTS before recreating the trigger.
-- ============================================================

-- Step 1: Ensure the configurable bonus value exists in site_settings.
-- ON CONFLICT DO NOTHING means this won't overwrite a value you've
-- already set via the admin panel.
INSERT INTO public.site_settings (key, value)
VALUES ('checkin_bonus_amount', '5')
ON CONFLICT (key) DO NOTHING;

-- Step 2: Create (or replace) the trigger function.
-- Reads site_settings.checkin_bonus_amount before every INSERT,
-- falls back to 5 if the key is missing.
CREATE OR REPLACE FUNCTION public.fn_set_checkin_reward()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_amount NUMERIC;
BEGIN
  SELECT COALESCE(value::NUMERIC, 5)
    INTO v_amount
    FROM public.site_settings
   WHERE key = 'checkin_bonus_amount'
   LIMIT 1;
  NEW.reward_amount := v_amount;
  RETURN NEW;
END;
$$;

-- Step 3: Attach the trigger to daily_checkins.
-- DROP IF EXISTS makes this idempotent — safe to run even if the
-- trigger already exists from a previous migration run.
DROP TRIGGER IF EXISTS trg_set_checkin_reward ON public.daily_checkins;
CREATE TRIGGER trg_set_checkin_reward
  BEFORE INSERT ON public.daily_checkins
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_checkin_reward();
