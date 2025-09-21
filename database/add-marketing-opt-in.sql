-- add-marketing-opt-in.sql
-- Adds marketing_opt_in column to public.profiles and backfills false
-- Run in development/staging first and verify before production.

BEGIN;

ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS marketing_opt_in boolean DEFAULT false;

-- Backfill existing rows to false where null
UPDATE public.profiles
SET marketing_opt_in = false
WHERE marketing_opt_in IS NULL;

COMMIT;

-- Optional: grant select/update to authenticated via RLS policy
-- If you use RLS on profiles, ensure a policy allows profile updates by owner.

-- Example policy (adjust to your needs):
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS profiles_owner_update ON public.profiles;
-- CREATE POLICY profiles_owner_update
--   ON public.profiles
--   FOR UPDATE
--   USING (auth.role() = 'authenticated' AND user_id = auth.uid())
--   WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());
