-- Migration: create questions table and upsert sample data
-- Run this in Supabase SQL editor or psql. This file is idempotent.

BEGIN;

-- Create table if it doesn't exist (choices stored as text[])
CREATE TABLE IF NOT EXISTS public.questions (
  id serial NOT NULL,
  question_text text NOT NULL,
  category text NOT NULL,
  difficulty text NOT NULL,
  choices text[] NOT NULL,
  correct_answer text NOT NULL,
  explanation text NULL,
  CONSTRAINT questions_pkey PRIMARY KEY (id),
  CONSTRAINT questions_difficulty_check CHECK (
    difficulty = ANY (ARRAY['Easy'::text, 'Medium'::text, 'Hard'::text])
  )
) TABLESPACE pg_default;

-- Ensure sequence ownership (safe idempotent step)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'questions') THEN
    -- table was just created above
    NULL;
  END IF;
END$$;

-- Upsert sample question records (idempotent)
INSERT INTO public.questions (id, question_text, category, difficulty, choices, correct_answer, explanation)
VALUES
  (3, 'Who is the only player to score in a World Cup final, European Cup/Champions League final, and UEFA Cup/Europa League final?', 'Player Records', 'Hard', ARRAY['Diego Maradona','Zinedine Zidane','Pel\'e','Ronaldo Naz\u00e1rio']::text[], 'Diego Maradona', 'Maradona achieved this unique feat across different competitions.'),
  (4, 'Which country has the record for most consecutive World Cup qualifications?', 'World Cup History', 'Hard', ARRAY['Brazil','Germany','Argentina','Spain']::text[], 'Brazil', 'Brazil has qualified for every World Cup since the tournament began in 1930 (22 consecutive tournaments).'),
  (5, 'Who was the first goalkeeper to score in a Premier League match?', 'Premier League', 'Hard', ARRAY['Peter Schmeichel','Brad Friedel','Tim Howard','Paul Robinson']::text[], 'Peter Schmeichel', 'Schmeichel scored for Aston Villa against Everton in October 2001.'),
  (6, 'Which player holds the record for fastest red card in Premier League history?', 'Premier League', 'Hard', ARRAY['Joey Barton','Patrick Vieira','David Pratt','Kevin Pressman']::text[], 'David Pratt', 'Pratt was sent off after just 15 seconds playing for Bradford City in 1997.'),
  (7, 'Which country has the record for most goals scored in a single World Cup match?', 'World Cup History', 'Hard', ARRAY['Hungary','Brazil','Germany','Argentina']::text[], 'Hungary', 'Hungary beat El Salvador 10-1 in 1982, the most goals by one team in a World Cup match.')
ON CONFLICT (id) DO UPDATE
SET
  question_text = EXCLUDED.question_text,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  choices = EXCLUDED.choices,
  correct_answer = EXCLUDED.correct_answer,
  explanation = EXCLUDED.explanation;

COMMIT;

-- Notes:
-- - This migration uses `choices` as `text[]` to match your schema.
-- - If you prefer JSONB for choices, convert the column and adjust the INSERTs accordingly.
