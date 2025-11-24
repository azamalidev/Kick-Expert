-- Create view to map quiz_results to competition_results for frontend compatibility
-- This view allows the frontend to use 'competition_results' while the backend uses 'quiz_results'

CREATE OR REPLACE VIEW competition_results AS
SELECT
    id,
    competition_id,
    user_id,
    session_id,
    score,
    rank,
    xp_awarded,
    trophy_awarded,
    prize_amount,
    metadata,
    created_at
FROM quiz_results;

-- Grant permissions on the view
GRANT SELECT ON competition_results TO authenticated;
GRANT INSERT ON competition_results TO authenticated;
GRANT UPDATE ON competition_results TO authenticated;

-- Add comment for documentation
COMMENT ON VIEW competition_results IS 'View mapping quiz_results table for frontend compatibility';