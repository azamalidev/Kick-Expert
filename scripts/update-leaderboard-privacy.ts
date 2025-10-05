import { createClient } from '@supabase/supabase-js'

// This script updates the get_top_users_leaderboard function to respect public_profile privacy settings
async function updateLeaderboardFunction() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables')
    console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    console.log('Updating get_top_users_leaderboard function to respect privacy settings...')

    // Since we can't run DDL through the REST API, we'll provide instructions
    console.log('Please run the following SQL in your Supabase SQL Editor:')
    console.log('')
    console.log('-- Update the get_top_users_leaderboard function to only show public profiles')
    console.log('CREATE OR REPLACE FUNCTION get_top_users_leaderboard()')
    console.log('RETURNS TABLE (')
    console.log('    user_id UUID,')
    console.log('    username TEXT,')
    console.log('    avatar_url TEXT,')
    console.log('    xp INTEGER,')
    console.log('    rank_label TEXT,')
    console.log('    total_games INTEGER,')
    console.log('    total_wins INTEGER,')
    console.log('    win_rate DECIMAL(5,2),')
    console.log('    rank_position INTEGER')
    console.log(') AS $$')
    console.log('BEGIN')
    console.log('    RETURN QUERY')
    console.log('    SELECT')
    console.log('        p.user_id,')
    console.log('        p.username,')
    console.log('        p.avatar_url,')
    console.log('        p.xp,')
    console.log('        p.rank_label,')
    console.log('        p.total_games,')
    console.log('        p.total_wins,')
    console.log('        CASE')
    console.log('            WHEN p.total_games > 0 THEN ROUND((p.total_wins::DECIMAL / p.total_games) * 100, 2)')
    console.log('            ELSE 0.00')
    console.log('        END as win_rate,')
    console.log('        ROW_NUMBER() OVER (ORDER BY p.xp DESC, p.total_wins DESC, p.total_games ASC)::INTEGER as rank_position')
    console.log('    FROM profiles p')
    console.log('    WHERE p.xp > 0  -- Only include users with XP')
    console.log('    AND p.public_profile = true  -- Only include users with public profiles')
    console.log('    ORDER BY p.xp DESC, p.total_wins DESC, p.total_games ASC')
    console.log('    LIMIT 10;')
    console.log('END;')
    console.log('$$ LANGUAGE plpgsql SECURITY DEFINER;')
    console.log('')
    console.log('Or run the updated file: database/setup-leaderboard-functions.sql')

  } catch (error) {
    console.error('Script failed:', error)
    process.exit(1)
  }
}

updateLeaderboardFunction()