-- Trophy System Database Setup
-- Run this file in your Supabase SQL editor to set up the trophy system

-- Create trophies table
CREATE TABLE IF NOT EXISTS public.trophies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    trophy_type TEXT NOT NULL CHECK (trophy_type IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_id UUID REFERENCES public.competition_sessions(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique constraint to prevent duplicate trophies
CREATE UNIQUE INDEX IF NOT EXISTS idx_trophies_user_title 
ON public.trophies(user_id, title);

-- Enable RLS (Row Level Security)
ALTER TABLE public.trophies ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own trophies" ON public.trophies
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trophies" ON public.trophies
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to check and award XP-based trophies
CREATE OR REPLACE FUNCTION public.check_and_award_xp_trophies(
    target_user_id UUID,
    current_session_id UUID DEFAULT NULL
)
RETURNS TABLE (
    awarded_trophy_id UUID,
    trophy_type TEXT,
    title TEXT,
    description TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_xp INTEGER;
    trophy_record RECORD;
    new_trophy_id UUID;
BEGIN
    -- Get user's current XP from profiles table
    SELECT COALESCE(xp, 0) INTO user_xp 
    FROM public.profiles 
    WHERE user_id = target_user_id;
    
    -- If no profile found, return empty
    IF user_xp IS NULL THEN
        RETURN;
    END IF;
    
    -- Define XP milestones and their corresponding trophies (updated thresholds)
    FOR trophy_record IN 
        SELECT * FROM (VALUES
            (200, 'bronze', 'Rising Star', 'Reached Starter rank! You''re making progress in your football journey.'),
            (500, 'silver', 'Skilled Player', 'Achieved Pro rank! Your knowledge is expanding significantly.'),
            (1000, 'gold', 'Expert Champion', 'Reached Expert rank! You''re a true football expert.'),
            (2000, 'platinum', 'Elite Master', 'Champion rank achieved! You''re among the elite players.')
        ) AS milestones(xp_required, type_name, trophy_title, trophy_desc)
        WHERE user_xp >= milestones.xp_required
    LOOP
        -- Try to insert trophy (will fail silently if duplicate due to unique constraint)
        BEGIN
            INSERT INTO public.trophies (
                user_id, 
                trophy_type, 
                title, 
                description, 
                session_id
            ) VALUES (
                target_user_id, 
                trophy_record.type_name, 
                trophy_record.trophy_title, 
                trophy_record.trophy_desc, 
                current_session_id
            )
            RETURNING id INTO new_trophy_id;
            
            -- If successful, return the awarded trophy
            awarded_trophy_id := new_trophy_id;
            trophy_type := trophy_record.type_name;
            title := trophy_record.trophy_title;
            description := trophy_record.trophy_desc;
            
            RETURN NEXT;
            
        EXCEPTION WHEN unique_violation THEN
            -- Trophy already exists, skip silently
            CONTINUE;
        END;
    END LOOP;
    
    RETURN;
END;
$$;

-- Function to get all trophies for a user
CREATE OR REPLACE FUNCTION public.get_user_trophies(target_user_id UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    trophy_type TEXT,
    title TEXT,
    description TEXT,
    earned_at TIMESTAMP WITH TIME ZONE,
    session_id UUID
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.user_id,
        t.trophy_type,
        t.title,
        t.description,
        t.earned_at,
        t.session_id
    FROM public.trophies t
    WHERE t.user_id = target_user_id
    ORDER BY t.earned_at DESC;
END;
$$;

-- Function to get trophy stats for a user
CREATE OR REPLACE FUNCTION public.get_user_trophy_stats(target_user_id UUID)
RETURNS TABLE (
    total_trophies BIGINT,
    bronze_count BIGINT,
    silver_count BIGINT,
    gold_count BIGINT,
    platinum_count BIGINT,
    diamond_count BIGINT,
    latest_trophy_date TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_trophies,
        COUNT(*) FILTER (WHERE trophy_type = 'bronze') as bronze_count,
        COUNT(*) FILTER (WHERE trophy_type = 'silver') as silver_count,
        COUNT(*) FILTER (WHERE trophy_type = 'gold') as gold_count,
        COUNT(*) FILTER (WHERE trophy_type = 'platinum') as platinum_count,
        COUNT(*) FILTER (WHERE trophy_type = 'diamond') as diamond_count,
        MAX(earned_at) as latest_trophy_date
    FROM public.trophies
    WHERE user_id = target_user_id;
END;
$$;

-- Function to get trophy leaderboard
CREATE OR REPLACE FUNCTION public.get_trophy_leaderboard()
RETURNS TABLE (
    user_id UUID,
    username TEXT,
    avatar_url TEXT,
    total_trophies BIGINT,
    diamond_count BIGINT,
    platinum_count BIGINT,
    gold_count BIGINT,
    silver_count BIGINT,
    bronze_count BIGINT,
    latest_trophy_date TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.user_id,
        p.username,
        p.avatar_url,
        COUNT(t.id) as total_trophies,
        COUNT(t.id) FILTER (WHERE t.trophy_type = 'diamond') as diamond_count,
        COUNT(t.id) FILTER (WHERE t.trophy_type = 'platinum') as platinum_count,
        COUNT(t.id) FILTER (WHERE t.trophy_type = 'gold') as gold_count,
        COUNT(t.id) FILTER (WHERE t.trophy_type = 'silver') as silver_count,
        COUNT(t.id) FILTER (WHERE t.trophy_type = 'bronze') as bronze_count,
        MAX(t.earned_at) as latest_trophy_date
    FROM public.profiles p
    LEFT JOIN public.trophies t ON p.user_id = t.user_id
    GROUP BY p.user_id, p.username, p.avatar_url
    HAVING COUNT(t.id) > 0
    ORDER BY total_trophies DESC, latest_trophy_date DESC
    LIMIT 50;
END;
$$;  