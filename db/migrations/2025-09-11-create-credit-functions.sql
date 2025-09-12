-- Add purchased credits
CREATE OR REPLACE FUNCTION add_purchased_credits(
  p_user_id UUID,
  p_amount DECIMAL(10,2)
) RETURNS void AS $$
BEGIN
  INSERT INTO user_credits (user_id, purchased_credits, winnings_credits, referral_credits)
  VALUES (p_user_id, p_amount, 0, 0)
  ON CONFLICT (user_id)
  DO UPDATE SET purchased_credits = user_credits.purchased_credits + p_amount;
END;
$$ LANGUAGE plpgsql;

-- Add winnings credits
CREATE OR REPLACE FUNCTION add_winnings_credits(
  p_user_id UUID,
  p_amount DECIMAL(10,2)
) RETURNS void AS $$
BEGIN
  INSERT INTO user_credits (user_id, purchased_credits, winnings_credits, referral_credits)
  VALUES (p_user_id, 0, p_amount, 0)
  ON CONFLICT (user_id)
  DO UPDATE SET winnings_credits = user_credits.winnings_credits + p_amount;
END;
$$ LANGUAGE plpgsql;

-- Add referral credits
CREATE OR REPLACE FUNCTION add_referral_credits(
  p_user_id UUID,
  p_amount DECIMAL(10,2)
) RETURNS void AS $$
BEGIN
  INSERT INTO user_credits (user_id, purchased_credits, winnings_credits, referral_credits)
  VALUES (p_user_id, 0, 0, p_amount)
  ON CONFLICT (user_id)
  DO UPDATE SET referral_credits = user_credits.referral_credits + p_amount;
END;
$$ LANGUAGE plpgsql;

-- Deduct credits function that handles the order of deduction
CREATE OR REPLACE FUNCTION deduct_credits(
  p_user_id UUID,
  p_amount DECIMAL(10,2)
) RETURNS TABLE (
  used_referral DECIMAL(10,2),
  used_purchased DECIMAL(10,2),
  used_winnings DECIMAL(10,2),
  success BOOLEAN
) AS $$
DECLARE
  v_credits RECORD;
  v_remaining DECIMAL(10,2);
  v_used_referral DECIMAL(10,2) := 0;
  v_used_purchased DECIMAL(10,2) := 0;
  v_used_winnings DECIMAL(10,2) := 0;
BEGIN
  -- Get current credit balances
  SELECT * INTO v_credits
  FROM user_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- Initialize remaining amount
  v_remaining := p_amount;

  -- First use referral credits
  IF v_credits.referral_credits > 0 THEN
    v_used_referral := LEAST(v_credits.referral_credits, v_remaining);
    v_remaining := v_remaining - v_used_referral;
  END IF;

  -- Then use purchased credits
  IF v_remaining > 0 AND v_credits.purchased_credits > 0 THEN
    v_used_purchased := LEAST(v_credits.purchased_credits, v_remaining);
    v_remaining := v_remaining - v_used_purchased;
  END IF;

  -- Finally use winnings credits
  IF v_remaining > 0 AND v_credits.winnings_credits > 0 THEN
    v_used_winnings := LEAST(v_credits.winnings_credits, v_remaining);
    v_remaining := v_remaining - v_used_winnings;
  END IF;

  -- Check if we have enough credits
  IF v_remaining > 0 THEN
    RETURN QUERY SELECT
      v_used_referral::DECIMAL(10,2),
      v_used_purchased::DECIMAL(10,2),
      v_used_winnings::DECIMAL(10,2),
      FALSE;
    RETURN;
  END IF;

  -- Update credit balances
  UPDATE user_credits
  SET
    referral_credits = referral_credits - v_used_referral,
    purchased_credits = purchased_credits - v_used_purchased,
    winnings_credits = winnings_credits - v_used_winnings
  WHERE user_id = p_user_id;

  RETURN QUERY SELECT
    v_used_referral::DECIMAL(10,2),
    v_used_purchased::DECIMAL(10,2),
    v_used_winnings::DECIMAL(10,2),
    TRUE;
END;
$$ LANGUAGE plpgsql;
