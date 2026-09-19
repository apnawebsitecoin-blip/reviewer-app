-- =============================================================================
-- Fraud / abuse safeguards migration
-- Run in: Supabase Dashboard → SQL Editor
-- =============================================================================

-- 1. Track referral bonus idempotency (prevents double-credit on page reload)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_bonus_paid_at TIMESTAMPTZ;

-- signup_ip was added by the log-ip migration; ensure it exists
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS signup_ip TEXT;

-- 2. Indexes to make fraud-signal queries fast
CREATE INDEX IF NOT EXISTS idx_profiles_signup_ip
  ON public.profiles (signup_ip);

CREATE INDEX IF NOT EXISTS idx_profiles_referral_ip_time
  ON public.profiles (signup_ip, referral_bonus_paid_at)
  WHERE referral_bonus_paid_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_clicks_reviewer_product_time
  ON public.clicks (reviewer_id, product_id, clicked_at DESC);

-- 3. Atomic wallet increment — avoids read-modify-write race in referral bonus
CREATE OR REPLACE FUNCTION public.fn_increment_wallet(p_user_id UUID, p_amount NUMERIC)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE public.profiles
  SET wallet_balance = wallet_balance + p_amount
  WHERE id = p_user_id;
$$;
