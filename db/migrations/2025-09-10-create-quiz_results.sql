-- Migration: create quiz_results (aka competition_results)
-- Creates a table to store per-user aggregated competition results used by leaderboards and notifications.
-- Idempotent: uses IF NOT EXISTS where appropriate.

-- Note: this uses gen_random_uuid() (pgcrypto). If your Postgres uses uuid-ossp, replace gen_random_uuid() with uuid_generate_v4().

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.quiz_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.competition_sessions(id) ON DELETE SET NULL,
  score integer NOT NULL DEFAULT 0,
  rank integer,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Ensure one result row per user per competition
CREATE UNIQUE INDEX IF NOT EXISTS quiz_results_competition_user_uq ON public.quiz_results (competition_id, user_id);

-- Indexes for common lookups
CREATE INDEX IF NOT EXISTS quiz_results_comp_idx ON public.quiz_results (competition_id);
CREATE INDEX IF NOT EXISTS quiz_results_user_idx ON public.quiz_results (user_id);

-- Optional: a materialized leaderboard view may be created separately for fast reads
-- Example read-only view (uncomment if you want a simple leaderboard view):
--
-- CREATE MATERIALIZED VIEW IF NOT EXISTS public.leaderboard_competition AS
-- SELECT competition_id, user_id, score, rank, metadata, created_at
-- FROM public.quiz_results
-- WHERE score IS NOT NULL;
--
-- To refresh the materialized view: REFRESH MATERIALIZED VIEW public.leaderboard_competition;

-- End of migration
