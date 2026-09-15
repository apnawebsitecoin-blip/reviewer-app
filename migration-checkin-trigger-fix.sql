-- ============================================================
-- Migration: Dynamic check-in bonus trigger (JSONB-correct)
-- Date: 2026-09-15
-- Run this in Supabase Dashboard → SQL Editor
--
-- PURPOSE: Makes the daily check-in reward_amount read from
--   site_settings.settings->>'checkin_bonus_amount' (the single
--   JSONB row at id=1) instead of the hardcoded DEFAULT 5.
--
-- SAFE TO RE-RUN:
--   - Seed step only writes if the key is not already present.
--   - Trigger function uses CREATE OR REPLACE.
--   - Trigger uses DROP IF EXISTS before recreating.
-- ============================================================


-- ── Step 1: Seed default value into the settings JSONB ────────
-- Only sets checkin_bonus_amount if the key does not already exist,
-- so running this a second time won't overwrite an admin-set value.
UPDATE public.site_settings
SET    settings = settings || '{"checkin_bonus_amount": "5"}'::jsonb
WHERE  id = 1
  AND  NOT (settings ? 'checkin_bonus_amount');


-- ── Step 2: Trigger function ──────────────────────────────────
-- On every INSERT into daily_checkins, reads
--   site_settings.settings->>'checkin_bonus_amount'
-- and sets NEW.reward_amount to that value.
-- Falls back to 5 if the key is missing or non-numeric.
CREATE OR REPLACE FUNCTION public.fn_set_checkin_reward()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_amount NUMERIC;
BEGIN
  SELECT COALESCE(
           (settings->>'checkin_bonus_amount')::NUMERIC,
           5
         )
    INTO v_amount
    FROM public.site_settings
   WHERE id = 1
   LIMIT 1;

  NEW.reward_amount := v_amount;
  RETURN NEW;
END;
$$;


-- ── Step 3: Attach trigger to daily_checkins ──────────────────
DROP TRIGGER IF EXISTS trg_set_checkin_reward ON public.daily_checkins;

CREATE TRIGGER trg_set_checkin_reward
  BEFORE INSERT ON public.daily_checkins
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_set_checkin_reward();
