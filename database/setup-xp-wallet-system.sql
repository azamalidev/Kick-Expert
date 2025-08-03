-- XP, Wallet, and History Integration Tables
-- Run this SQL in your Supabase SQL Editor

-- Create wallets table if it doesn't exist
CREATE TABLE IF NOT EXISTS wallets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    balance DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create xp_history table if it doesn't exist
CREATE TABLE IF NOT EXISTS xp_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    xp_gained INTEGER NOT NULL,
    source TEXT NOT NULL, -- 'league_competition', 'quiz', 'achievement', etc.
    description TEXT,
    session_id UUID REFERENCES competition_sessions(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('reward', 'purchase', 'refund', 'bonus')),
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    description TEXT,
    source TEXT, -- 'league_competition', 'store_purchase', etc.
    session_id UUID REFERENCES competition_sessions(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update profiles table to include missing columns
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS total_wins INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_games INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS rank_label TEXT DEFAULT 'Beginner';

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_wallets_updated_at 
    BEFORE UPDATE ON wallets 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for wallets
CREATE POLICY "Users can view their own wallet" ON wallets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet" ON wallets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wallet" ON wallets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for xp_history
CREATE POLICY "Users can view their own XP history" ON xp_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert XP history" ON xp_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for transactions
CREATE POLICY "Users can view their own transactions" ON transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert transactions" ON transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_history_user_id ON xp_history(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_history_created_at ON xp_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

-- Function to automatically create wallet for new users
CREATE OR REPLACE FUNCTION create_user_wallet()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO wallets (user_id, balance)
    VALUES (NEW.user_id, 0.00);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create wallet when profile is created
CREATE TRIGGER create_wallet_on_profile_creation
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION create_user_wallet();

-- Function to update rank based on XP
CREATE OR REPLACE FUNCTION update_user_rank()
RETURNS TRIGGER AS $$
BEGIN
    -- Update rank based on XP thresholds
    IF NEW.xp >= 5000 THEN
        NEW.rank_label = 'Legend';
    ELSIF NEW.xp >= 3000 THEN
        NEW.rank_label = 'Master';
    ELSIF NEW.xp >= 2000 THEN
        NEW.rank_label = 'Expert';
    ELSIF NEW.xp >= 1200 THEN
        NEW.rank_label = 'Advanced';
    ELSIF NEW.xp >= 600 THEN
        NEW.rank_label = 'Intermediate';
    ELSIF NEW.xp >= 200 THEN
        NEW.rank_label = 'Novice';
    ELSE
        NEW.rank_label = 'Beginner';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update rank when XP changes
CREATE TRIGGER update_rank_on_xp_change
    BEFORE UPDATE OF xp ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_user_rank();
