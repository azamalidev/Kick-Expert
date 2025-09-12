-- Create user_credits table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_credits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    purchased_credits DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
    winnings_credits DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
    referral_credits DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create credit_transactions table if it doesn't exist (if not already created)
CREATE TABLE IF NOT EXISTS credit_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    credit_type TEXT NOT NULL CHECK (credit_type IN ('purchased', 'winnings', 'referral')),
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'refund', 'win', 'referral', 'use')),
    payment_method TEXT,
    payment_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create updated_at trigger for user_credits
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger for user_credits
CREATE TRIGGER update_user_credits_updated_at
    BEFORE UPDATE ON user_credits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_credits
CREATE POLICY "Users can view their own credits"
    ON user_credits FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System can update user credits"
    ON user_credits FOR UPDATE
    USING (true);

CREATE POLICY "System can insert user credits"
    ON user_credits FOR INSERT
    WITH CHECK (true);

-- Create RLS policies for credit_transactions
CREATE POLICY "Users can view their own transactions"
    ON credit_transactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System can insert credit transactions"
    ON credit_transactions FOR INSERT
    WITH CHECK (true);

CREATE POLICY "System can update credit transactions"
    ON credit_transactions FOR UPDATE
    USING (true);

-- Function to create credit account for new users
CREATE OR REPLACE FUNCTION create_user_credit_account()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_credits (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create credit account when user is created
DROP TRIGGER IF EXISTS create_credit_account_on_user_creation ON auth.users;
CREATE TRIGGER create_credit_account_on_user_creation
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_credit_account();

-- Function to add purchased credits
CREATE OR REPLACE FUNCTION add_purchased_credits(
    p_user_id UUID,
    p_amount DECIMAL,
    p_payment_provider TEXT DEFAULT NULL,
    p_payment_id TEXT DEFAULT NULL,
    p_payment_data JSONB DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    -- First, try to update existing record
    UPDATE user_credits
    SET purchased_credits = purchased_credits + p_amount
    WHERE user_id = p_user_id;
    
    -- If no record exists, insert one
    IF NOT FOUND THEN
        INSERT INTO user_credits (user_id, purchased_credits)
        VALUES (p_user_id, p_amount);
    END IF;
    
    -- Insert a transaction record
    INSERT INTO credit_transactions (
        user_id,
        amount,
        credit_type,
        transaction_type,
        payment_method,
        payment_id,
        status
    ) VALUES (
        p_user_id,
        p_amount,
        'purchased',
        'purchase',
        p_payment_provider,
        p_payment_id,
        'completed'
    );

END;
$$ LANGUAGE plpgsql;

-- Function to use credits
CREATE OR REPLACE FUNCTION use_credits(
    p_user_id UUID,
    p_amount DECIMAL
)
RETURNS boolean AS $$
DECLARE
    v_referral_credits DECIMAL;
    v_purchased_credits DECIMAL;
    v_winnings_credits DECIMAL;
    v_remaining_amount DECIMAL;
BEGIN
    -- Get current credit balances
    SELECT 
        referral_credits,
        purchased_credits,
        winnings_credits
    INTO 
        v_referral_credits,
        v_purchased_credits,
        v_winnings_credits
    FROM user_credits
    WHERE user_id = p_user_id;
    
    -- Check if user has enough total credits
    IF (v_referral_credits + v_purchased_credits + v_winnings_credits) < p_amount THEN
        RETURN false;
    END IF;
    
    v_remaining_amount := p_amount;
    
    -- Use referral credits first
    IF v_referral_credits > 0 THEN
        IF v_referral_credits >= v_remaining_amount THEN
            UPDATE user_credits
            SET referral_credits = referral_credits - v_remaining_amount
            WHERE user_id = p_user_id;
            v_remaining_amount := 0;
        ELSE
            UPDATE user_credits
            SET referral_credits = 0
            WHERE user_id = p_user_id;
            v_remaining_amount := v_remaining_amount - v_referral_credits;
        END IF;
    END IF;
    
    -- Then use purchased credits
    IF v_remaining_amount > 0 AND v_purchased_credits > 0 THEN
        IF v_purchased_credits >= v_remaining_amount THEN
            UPDATE user_credits
            SET purchased_credits = purchased_credits - v_remaining_amount
            WHERE user_id = p_user_id;
            v_remaining_amount := 0;
        ELSE
            UPDATE user_credits
            SET purchased_credits = 0
            WHERE user_id = p_user_id;
            v_remaining_amount := v_remaining_amount - v_purchased_credits;
        END IF;
    END IF;
    
    -- Finally use winnings credits
    IF v_remaining_amount > 0 AND v_winnings_credits > 0 THEN
        IF v_winnings_credits >= v_remaining_amount THEN
            UPDATE user_credits
            SET winnings_credits = winnings_credits - v_remaining_amount
            WHERE user_id = p_user_id;
            v_remaining_amount := 0;
        ELSE
            UPDATE user_credits
            SET winnings_credits = 0
            WHERE user_id = p_user_id;
            v_remaining_amount := v_remaining_amount - v_winnings_credits;
        END IF;
    END IF;
    
    -- Insert transaction record
    INSERT INTO credit_transactions (
        user_id,
        amount,
        credit_type,
        transaction_type,
        status
    ) VALUES (
        p_user_id,
        p_amount,
        'purchased',
        'use',
        'completed'
    );
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;
