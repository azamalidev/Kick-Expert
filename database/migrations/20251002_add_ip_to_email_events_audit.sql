-- 20251002_add_ip_to_email_events_audit.sql
-- Add ip_address to email_events_audit for compliance logging

ALTER TABLE IF EXISTS public.email_events_audit
ADD COLUMN IF NOT EXISTS ip_address text;