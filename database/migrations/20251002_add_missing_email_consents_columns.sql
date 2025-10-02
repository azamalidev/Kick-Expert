-- 20251002_add_missing_email_consents_columns.sql
-- Add missing columns used by the app to the email_consents table (idempotent)

ALTER TABLE IF EXISTS public.email_consents
  ADD COLUMN IF NOT EXISTS status text;

ALTER TABLE IF EXISTS public.email_consents
  ADD COLUMN IF NOT EXISTS consent_source text;

ALTER TABLE IF EXISTS public.email_consents
  ADD COLUMN IF NOT EXISTS consent_date timestamptz;

ALTER TABLE IF EXISTS public.email_consents
  ADD COLUMN IF NOT EXISTS unsubscribe_date timestamptz;
