-- FIX: Remove trigger that sends notifications on credit purchase INSERT
-- This trigger is causing notifications to be sent even when payment is cancelled

-- Step 1: Find all triggers on credit_purchases table
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'credit_purchases';

-- Step 2: Drop any triggers that create notifications on INSERT
-- (Run the result of the above query first to see what triggers exist)
-- Example:
-- DROP TRIGGER IF EXISTS send_purchase_notification_trigger ON credit_purchases;

-- Step 3: Verify no triggers remain
SELECT 
    trigger_name,
    event_manipulation
FROM information_schema.triggers
WHERE event_object_table = 'credit_purchases';

-- Expected result: No rows (or only the update_credit_purchases_updated_at trigger)

/*
IMPORTANT:
The notification should ONLY be sent after payment is CONFIRMED, not when the purchase record is created.
Payment confirmation happens in /api/credits/success route, which now checks payment_status = 'paid'.
*/
