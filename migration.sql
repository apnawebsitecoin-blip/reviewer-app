-- ============================================================
-- Migration: Admin panel support for daily_checkins,
--            questions, and price_history
-- Date: 2026-09-15
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================


-- ── 1. daily_checkins ─────────────────────────────────────────
--
-- Assumptions: table exists (raikaro-app already inserts to it).
-- The raikaro-app inserts only { user_id } — reward_amount must
-- have a DEFAULT.  This migration:
--   a) creates the table if it doesn't exist yet
--   b) seeds the configurable bonus amount in site_settings
--   c) adds a BEFORE INSERT trigger so new check-ins pick up
--      the admin-configured bonus instead of a hardcoded DEFAULT

CREATE TABLE IF NOT EXISTS public.daily_checkins (
  id            UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID          NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  checked_in_at DATE          NOT NULL DEFAULT CURRENT_DATE,
  reward_amount NUMERIC(10,2) NOT NULL DEFAULT 5,
  UNIQUE (user_id, checked_in_at)   -- prevents duplicate check-ins per day
);

ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'daily_checkins' AND policyname = 'Users read own checkins'
  ) THEN
    CREATE POLICY "Users read own checkins"
      ON public.daily_checkins FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'daily_checkins' AND policyname = 'Users insert own checkins'
  ) THEN
    CREATE POLICY "Users insert own checkins"
      ON public.daily_checkins FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Seed configurable bonus in site_settings (admin panel reads/writes this)
INSERT INTO public.site_settings (key, value)
VALUES ('checkin_bonus_amount', '5')
ON CONFLICT (key) DO NOTHING;

-- Trigger: new check-ins read bonus amount from site_settings
-- NOTE: after running this, also update raikaro-app/screens/WalletScreen.tsx
--   to read reward_amount from the returned row (already in DailyCheckin type)
--   instead of showing the hardcoded "₹5 credited" alert message.
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

DROP TRIGGER IF EXISTS trg_set_checkin_reward ON public.daily_checkins;
CREATE TRIGGER trg_set_checkin_reward
  BEFORE INSERT ON public.daily_checkins
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_checkin_reward();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_daily_checkins_checked_in_at
  ON public.daily_checkins (checked_in_at DESC);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_id
  ON public.daily_checkins (user_id);


-- ── 2. questions ──────────────────────────────────────────────
--
-- Assumptions: table exists (QASection in reviewer-app already
-- queries it).  Creating IF NOT EXISTS is safe to run even if
-- the table already exists.

CREATE TABLE IF NOT EXISTS public.questions (
  id            UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id    UUID         NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  asked_by      UUID         NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_text TEXT         NOT NULL,
  answer_text   TEXT,
  answered_by   UUID         REFERENCES public.profiles(id),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'questions' AND policyname = 'Anyone can read questions'
  ) THEN
    CREATE POLICY "Anyone can read questions"
      ON public.questions FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'questions' AND policyname = 'Users can ask questions'
  ) THEN
    CREATE POLICY "Users can ask questions"
      ON public.questions FOR INSERT
      WITH CHECK (auth.uid() = asked_by);
  END IF;
END $$;

-- Admins update (answer) questions — relies on is_admin check in app
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'questions' AND policyname = 'Admins can answer questions'
  ) THEN
    CREATE POLICY "Admins can answer questions"
      ON public.questions FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid() AND is_admin = true
        )
      );
  END IF;
END $$;

-- Index for fast unanswered filter
CREATE INDEX IF NOT EXISTS idx_questions_unanswered
  ON public.questions (id) WHERE answer_text IS NULL;
CREATE INDEX IF NOT EXISTS idx_questions_product_id
  ON public.questions (product_id);


-- ── 3. price_history ─────────────────────────────────────────
--
-- Assumptions: table exists (raikaro-app queries it).
-- The admin DELETE feature requires an `id` column.
-- If your existing table has no `id`, the ALTER TABLE below adds it.
-- The CREATE TABLE IF NOT EXISTS is a no-op if the table already exists.

CREATE TABLE IF NOT EXISTS public.price_history (
  id          UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id  UUID          NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  price       NUMERIC(10,2) NOT NULL,
  recorded_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- If the table already exists but has no `id` column, add it:
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'price_history' AND column_name = 'id'
  ) THEN
    ALTER TABLE public.price_history
      ADD COLUMN id UUID DEFAULT gen_random_uuid() PRIMARY KEY;
  END IF;
END $$;

ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'price_history' AND policyname = 'Anyone can read price history'
  ) THEN
    CREATE POLICY "Anyone can read price history"
      ON public.price_history FOR SELECT USING (true);
  END IF;
END $$;

-- Admins insert/delete price history entries
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'price_history' AND policyname = 'Admins manage price history'
  ) THEN
    CREATE POLICY "Admins manage price history"
      ON public.price_history
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid() AND is_admin = true
        )
      );
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_price_history_product_id
  ON public.price_history (product_id);
CREATE INDEX IF NOT EXISTS idx_price_history_recorded_at
  ON public.price_history (recorded_at DESC);
