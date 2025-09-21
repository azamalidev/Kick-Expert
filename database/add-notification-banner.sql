-- Migration: add is_banner boolean to notifications (and ensure expiry_date exists)
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS is_banner boolean DEFAULT false;

-- Ensure expiry_date exists (already present in table definition, but keep safe)
ALTER TABLE public.notifications
  ALTER COLUMN expiry_date SET DEFAULT (now() + '90 days'::interval);

-- Optional: index on expiry_date for fast banner queries
CREATE INDEX IF NOT EXISTS idx_notifications_expiry_date ON public.notifications (expiry_date);
