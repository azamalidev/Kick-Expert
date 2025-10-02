-- Ensure ip_address column exists on email_consents (idempotent)
ALTER TABLE IF EXISTS public.email_consents
ADD COLUMN IF NOT EXISTS ip_address text;
