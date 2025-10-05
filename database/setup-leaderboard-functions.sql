-- Leaderboard and Stats SQL Functions
-- Run this in your Supabase SQL Editor

-- Function to get top 10 users by XP with rankings
CREATE OR REPLACE FUNCTION get_top_users_leaderboard(period TEXT DEFAULT 'all_time')
RETURNS TABLE (
    user_id UUID,
    username TEXT,
    avatar_url TEXT,
    xp INTEGER,
    rank_label TEXT,
    total_games INTEGER,
    total_wins INTEGER,
    win_rate DECIMAL(5,2),
    rank_position INTEGER
) AS $$
BEGIN
    -- For now, all periods return the same all-time data
    -- Future enhancement: implement period-specific logic when historical data is available
    RETURN QUERY
    SELECT
        p.user_id,
        p.username,
        p.avatar_url,
        p.xp,
        p.rank_label,
        p.total_games,
        p.total_wins,
        CASE
            WHEN p.total_games > 0 THEN ROUND((p.total_wins::DECIMAL / p.total_games) * 100, 2)
            ELSE 0.00
        END as win_rate,
        ROW_NUMBER() OVER (ORDER BY p.xp DESC, p.total_wins DESC, p.total_games ASC)::INTEGER as rank_position
    FROM profiles p
    WHERE p.xp > 0  -- Only include users with XP
    AND p.public_profile = true  -- Only include users with public profiles
    ORDER BY p.xp DESC, p.total_wins DESC, p.total_games ASC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user's detailed stats with ranking
CREATE OR REPLACE FUNCTION get_user_detailed_stats(target_user_id UUID)
RETURNS TABLE (
    user_id UUID,
    username TEXT,
    avatar_url TEXT,
    nationality TEXT,
    xp INTEGER,
    rank_label TEXT,
    total_games INTEGER,
    total_wins INTEGER,
    win_rate DECIMAL(5,2),
    global_rank INTEGER,
    total_users INTEGER,
    wallet_balance DECIMAL(10,2),
    total_earnings DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.user_id,
        p.username,
        p.avatar_url,
        p.nationality,
        p.xp,
        p.rank_label,
        p.total_games,
        p.total_wins,
        CASE 
            WHEN p.total_games > 0 THEN ROUND((p.total_wins::DECIMAL / p.total_games) * 100, 2)
            ELSE 0.00
        END as win_rate,
        (
            SELECT COUNT(*) + 1
            FROM profiles p2
            WHERE p2.xp > p.xp
        )::INTEGER as global_rank,
        (
            SELECT COUNT(*)
            FROM profiles p3
            WHERE p3.xp > 0
        )::INTEGER as total_users,
        COALESCE(w.balance, 0.00) as wallet_balance,
        COALESCE((
            SELECT SUM(amount)
            FROM transactions t
            WHERE t.user_id = target_user_id 
            AND t.type = 'reward' 
            AND t.status = 'completed'
        ), 0.00) as total_earnings,
        p.created_at
    FROM profiles p
    LEFT JOIN wallets w ON w.user_id = p.user_id
    WHERE p.user_id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's XP history for charts (last 30 entries)
CREATE OR REPLACE FUNCTION get_user_xp_history(target_user_id UUID)
RETURNS TABLE (
    id UUID,
    xp_gained INTEGER,
    source TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    cumulative_xp INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH xp_data AS (
        SELECT 
            xh.id,
            xh.xp_gained,
            xh.source,
            xh.description,
            xh.created_at,
            SUM(xh.xp_gained) OVER (ORDER BY xh.created_at)::INTEGER as cumulative_xp
        FROM xp_history xh
        WHERE xh.user_id = target_user_id
        ORDER BY xh.created_at DESC
        LIMIT 30
    )
    SELECT * FROM xp_data ORDER BY created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's transaction history (last 20 transactions)
CREATE OR REPLACE FUNCTION get_user_transaction_history(target_user_id UUID)
RETURNS TABLE (
    id UUID,
    amount DECIMAL(10,2),
    type TEXT,
    status TEXT,
    description TEXT,
    source TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.id,
        t.amount::DECIMAL(10,2),  -- Cast to ensure proper decimal type
        t.type,
        t.status,
        t.description,
        t.source,
        t.created_at::TIMESTAMP WITH TIME ZONE  -- Cast to ensure proper timestamp type
    FROM transactions t
    WHERE t.user_id = target_user_id
    ORDER BY t.created_at DESC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's monthly XP progress
CREATE OR REPLACE FUNCTION get_user_monthly_xp_progress(target_user_id UUID)
RETURNS TABLE (
    month_year TEXT,
    xp_gained INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        TO_CHAR(DATE_TRUNC('month', xh.created_at), 'YYYY-MM') as month_year,
        COALESCE(SUM(xh.xp_gained), 0)::INTEGER as xp_gained
    FROM xp_history xh
    WHERE xh.user_id = target_user_id
    AND xh.created_at >= NOW() - INTERVAL '12 months'
    GROUP BY DATE_TRUNC('month', xh.created_at)
    ORDER BY DATE_TRUNC('month', xh.created_at) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RLS policies for the functions
-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_top_users_leaderboard(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_detailed_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_xp_history(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_transaction_history(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_monthly_xp_progress(UUID) TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_xp_desc ON profiles(xp DESC);
CREATE INDEX IF NOT EXISTS idx_xp_history_user_created ON xp_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_created ON transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_type_status ON transactions(user_id, type, status);
