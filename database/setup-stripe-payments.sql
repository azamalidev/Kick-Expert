-- Create credit_purchases table if it doesn't exist
CREATE TABLE IF NOT EXISTS credit_purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  credits INTEGER NOT NULL,
  payment_provider TEXT NOT NULL,
  payment_id TEXT,
  payment_data JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Add RLS policies
ALTER TABLE credit_purchases ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own purchases
CREATE POLICY "Users can view their own purchases" ON credit_purchases
  FOR SELECT
  USING (auth.uid() = user_id);

-- System can insert purchases
CREATE POLICY "System can insert purchases" ON credit_purchases
  FOR INSERT
  WITH CHECK (true);

-- System can update purchases
CREATE POLICY "System can update purchases" ON credit_purchases
  FOR UPDATE
  USING (true);

-- Create function to process successful payments
CREATE OR REPLACE FUNCTION process_successful_payment(
  p_purchase_id UUID,
  p_payment_id TEXT,
  p_payment_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_credits INTEGER;
  v_result JSONB;
BEGIN
  -- Get purchase details
  SELECT user_id, credits INTO v_user_id, v_credits
  FROM credit_purchases
  WHERE id = p_purchase_id AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Purchase not found or already processed';
  END IF;

  -- Update purchase status
  UPDATE credit_purchases
  SET 
    status = 'completed',
    payment_id = p_payment_id,
    payment_data = p_payment_data,
    updated_at = NOW()
  WHERE id = p_purchase_id;

  -- Add credits to user's balance
  UPDATE user_credits
  SET 
    purchased_credits = COALESCE(purchased_credits, 0) + v_credits,
    updated_at = NOW()
  WHERE user_id = v_user_id;

  -- Return success result
  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'credits_added', v_credits
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;
