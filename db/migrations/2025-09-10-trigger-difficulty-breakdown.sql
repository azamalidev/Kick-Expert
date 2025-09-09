-- Migration: trigger to auto-populate competition_sessions.difficulty_breakdown on insert
-- Idempotent: uses CREATE OR REPLACE FUNCTION and checks for existing trigger

BEGIN;

-- Function: compute difficulty breakdown from competition_questions for the competition
CREATE OR REPLACE FUNCTION public.compute_difficulty_breakdown_for_session()
RETURNS trigger AS $$
BEGIN
  -- Only populate when not provided
  IF NEW.difficulty_breakdown IS NULL OR NEW.difficulty_breakdown = '{}'::jsonb THEN
    NEW.difficulty_breakdown := (
      SELECT jsonb_build_object(
        'easy', COALESCE(SUM(CASE WHEN difficulty IS NULL THEN 0 WHEN difficulty::text ILIKE 'easy' THEN 1 WHEN difficulty::text ~ '^[0-9]+$' AND difficulty::int = 1 THEN 1 ELSE 0 END), 0),
        'medium', COALESCE(SUM(CASE WHEN difficulty IS NULL THEN 0 WHEN difficulty::text ILIKE 'medium' THEN 1 WHEN difficulty::text ~ '^[0-9]+$' AND difficulty::int = 2 THEN 1 ELSE 0 END), 0),
        'hard', COALESCE(SUM(CASE WHEN difficulty IS NULL THEN 0 WHEN difficulty::text ILIKE 'hard' THEN 1 WHEN difficulty::text ~ '^[0-9]+$' AND difficulty::int = 3 THEN 1 ELSE 0 END), 0)
      )
      FROM public.competition_questions cq
      WHERE cq.competition_id = NEW.competition_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Create trigger if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_compute_difficulty_breakdown'
  ) THEN
    CREATE TRIGGER trg_compute_difficulty_breakdown
    BEFORE INSERT ON public.competition_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.compute_difficulty_breakdown_for_session();
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMIT;
