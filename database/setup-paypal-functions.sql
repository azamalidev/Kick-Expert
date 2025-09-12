-- Create function to process PayPal credit purchase
CREATE OR REPLACE FUNCTION process_paypal_credit_purchase(
    p_transaction_id TEXT,
    p_user_id UUID,
    p_amount DECIMAL,
    p_credits DECIMAL,
    p_payment_data JSONB DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_transaction record;
    v_result JSONB;
BEGIN
    -- Get the transaction record and lock it
    SELECT * INTO v_transaction
    FROM credit_transactions
    WHERE payment_id = p_transaction_id
    AND user_id = p_user_id
    AND status = 'pending'
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid or already processed transaction';
    END IF;

    -- Begin transaction
    BEGIN
        -- Update transaction status
        UPDATE credit_transactions
        SET status = 'completed',
            updated_at = NOW(),
            completed_at = NOW()
        WHERE payment_id = p_transaction_id;

        -- Add credits to user's balance
        PERFORM add_purchased_credits(
            p_user_id,
            p_credits,
            'paypal',
            p_transaction_id,
            p_payment_data
        );

        -- Return success result
        v_result := jsonb_build_object(
            'success', true,
            'transaction_id', p_transaction_id,
            'credits_added', p_credits
        );

        RETURN v_result;
    EXCEPTION
        WHEN OTHERS THEN
            -- Rollback will happen automatically
            RAISE EXCEPTION 'Failed to process purchase: %', SQLERRM;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
