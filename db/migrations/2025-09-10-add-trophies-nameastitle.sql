-- Migration: add nameastitle column to trophies to satisfy client selects
-- Idempotent and safe to run multiple times

BEGIN;

-- Add column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'trophies' AND column_name = 'nameastitle'
  ) THEN
    ALTER TABLE public.trophies
      ADD COLUMN nameastitle text;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Backfill from the first sensible existing column (safe: avoid error if 'name' doesn't exist)
DO $$
DECLARE
  src_col text;
  candidates text[] := ARRAY['name','title','label','display_name','name_as_title'];
BEGIN
  FOREACH src_col IN ARRAY candidates LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'trophies' AND column_name = src_col
    ) THEN
      EXECUTE format('UPDATE public.trophies SET nameastitle = %I WHERE nameastitle IS NULL AND %I IS NOT NULL', src_col, src_col);
      RAISE NOTICE 'Backfilled nameastitle from %', src_col;
      RETURN;
    END IF;
  END LOOP;
  -- If none of the candidate columns exist, do nothing.
END;
$$ LANGUAGE plpgsql;

-- Optional index
CREATE INDEX IF NOT EXISTS idx_trophies_nameastitle ON public.trophies (nameastitle);

COMMIT;
