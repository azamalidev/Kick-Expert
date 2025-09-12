-- Create credit_purchases table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.credit_purchases (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  credits integer NOT NULL,
  payment_provider text NOT NULL,
  payment_id text NULL,
  payment_data jsonb NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT credit_purchases_pkey PRIMARY KEY (id),
  CONSTRAINT credit_purchases_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE
) TABLESPACE pg_default;

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

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_credit_purchases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_credit_purchases_updated_at
    BEFORE UPDATE ON credit_purchases
    FOR EACH ROW
    EXECUTE FUNCTION update_credit_purchases_updated_at();

-- Create function to process successful payments
CREATE OR REPLACE FUNCTION process_successful_payment(
  p_purchase_id UUID,
  p_user_id UUID,
  p_new_credits INTEGER,
  p_payment_data JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Begin transaction
  BEGIN
    -- Update purchase record
    UPDATE credit_purchases
    SET 
      status = 'completed',
      payment_data = p_payment_data,
      updated_at = NOW()
    WHERE id = p_purchase_id AND status = 'pending';

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Purchase not found or already processed';
    END IF;

    -- Update user's credits
    UPDATE profiles
    SET 
      current_credits = p_new_credits,
      updated_at = NOW()
    WHERE id = p_user_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'User profile not found';
    END IF;

    -- If we get here, commit the transaction
    COMMIT;
  EXCEPTION
    WHEN OTHERS THEN
      -- On error, roll back the transaction
      ROLLBACK;
      RAISE;
  END;
END;
$$;
