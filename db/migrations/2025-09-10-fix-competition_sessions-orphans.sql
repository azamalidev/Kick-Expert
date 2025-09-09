-- Migration: Nullify orphan competition_sessions.user_id and add FK constraint
-- Idempotent: safe to run multiple times.

BEGIN;

-- Allow user_id to be NULL (no-op if already nullable)
ALTER TABLE IF EXISTS public.competition_sessions
  ALTER COLUMN user_id DROP NOT NULL;

-- Set user_id to NULL for rows referencing non-existent auth.users
UPDATE public.competition_sessions
SET user_id = NULL
WHERE user_id IS NOT NULL
  AND user_id NOT IN (SELECT id FROM auth.users);

-- Add FK constraint if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'competition_sessions'
      AND c.contype = 'f'
      AND c.conname = 'competition_sessions_user_id_fkey'
  ) THEN
    ALTER TABLE public.competition_sessions
      ADD CONSTRAINT competition_sessions_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Index for lookups (safe if exists)
CREATE INDEX IF NOT EXISTS idx_competition_sessions_user ON public.competition_sessions (user_id);

COMMIT;
