-- Migration: add paypal_email to user_payment_accounts and unique index for upsert
BEGIN;

-- 1) Add paypal_email column
ALTER TABLE IF EXISTS public.user_payment_accounts
  ADD COLUMN IF NOT EXISTS paypal_email text;

-- 2) Index paypal_email for lookups
CREATE INDEX IF NOT EXISTS idx_user_payment_accounts_paypal_email ON public.user_payment_accounts (paypal_email);

-- 3) Ensure a unique row per user for safe upserts (make sure no duplicates exist before running in production)
-- If duplicates exist, merge them first (not done here).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='user_payment_accounts' AND indexname='uq_user_payment_accounts_user_id') THEN
    EXECUTE 'CREATE UNIQUE INDEX uq_user_payment_accounts_user_id ON public.user_payment_accounts (user_id)';
  END IF;
END$$;

COMMIT;
