-- Migration: Add competition result fields to quiz_results table
-- Adds fields needed for prize distribution and trophy awarding

ALTER TABLE quiz_results
ADD COLUMN IF NOT EXISTS xp_awarded INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS trophy_awarded BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS prize_amount DECIMAL(10,2) DEFAULT 0.00;

-- Add comments for documentation
COMMENT ON COLUMN quiz_results.xp_awarded IS 'XP points awarded for this competition result';
COMMENT ON COLUMN quiz_results.trophy_awarded IS 'Whether a trophy was awarded for this result';
COMMENT ON COLUMN quiz_results.prize_amount IS 'Credit prize amount awarded for this result';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_quiz_results_xp_awarded ON quiz_results(xp_awarded);
CREATE INDEX IF NOT EXISTS idx_quiz_results_trophy_awarded ON quiz_results(trophy_awarded);
CREATE INDEX IF NOT EXISTS idx_quiz_results_prize_amount ON quiz_results(prize_amount);