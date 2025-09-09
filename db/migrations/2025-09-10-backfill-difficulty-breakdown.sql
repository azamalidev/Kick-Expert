-- Migration: backfill competition_sessions.difficulty_breakdown handling mixed difficulty types
-- Idempotent: uses COALESCE and type-safe checks

BEGIN;

-- Compute difficulty breakdown from competition_questions and write to sessions where missing
WITH breakdowns AS (
  SELECT
    competition_id,
    jsonb_build_object(
      'easy',  COALESCE(SUM(CASE WHEN (difficulty IS NULL) THEN 0 WHEN difficulty::text ILIKE 'easy' THEN 1 WHEN difficulty::text ~ '^[0-9]+$' AND (difficulty::int = 1) THEN 1 ELSE 0 END), 0),
      'medium', COALESCE(SUM(CASE WHEN (difficulty IS NULL) THEN 0 WHEN difficulty::text ILIKE 'medium' THEN 1 WHEN difficulty::text ~ '^[0-9]+$' AND (difficulty::int = 2) THEN 1 ELSE 0 END), 0),
      'hard',  COALESCE(SUM(CASE WHEN (difficulty IS NULL) THEN 0 WHEN difficulty::text ILIKE 'hard' THEN 1 WHEN difficulty::text ~ '^[0-9]+$' AND (difficulty::int = 3) THEN 1 ELSE 0 END), 0)
    ) AS counts
  FROM public.competition_questions
  GROUP BY competition_id
)
UPDATE public.competition_sessions cs
SET difficulty_breakdown = d.counts
FROM breakdowns d
WHERE cs.competition_id = d.competition_id
  AND (cs.difficulty_breakdown IS NULL OR cs.difficulty_breakdown = '{}'::jsonb);

COMMIT;
