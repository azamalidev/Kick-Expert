/**
 * Stripe Account Helper
 * 
 * This utility helps manage Stripe account IDs and ensures they're stored
 * in multiple places for redundancy and recovery.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(SUPABASE_URL || '', SERVICE_ROLE_KEY || '', {
  auth: { persistSession: false }
});

/**
 * Store Stripe account ID in user metadata for recovery
 * 
 * This ensures that even if the user_payment_accounts table is cleared,
 * we can still recover the Stripe account ID from user metadata.
 */
export async function storeStripeAccountIdInMetadata(
  userId: string,
  stripeAccountId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Update user metadata with Stripe account ID
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: {
        stripe_account_id: stripeAccountId
      }
    });

    if (error) {
      console.error('Error storing Stripe account ID in metadata:', error);
      return { success: false, error: error.message };
    }

    console.log(`Stored Stripe account ID ${stripeAccountId} in user metadata for user ${userId}`);
    return { success: true };
  } catch (err: any) {
    console.error('Unexpected error storing Stripe account ID:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Retrieve Stripe account ID from user metadata
 */
export async function getStripeAccountIdFromMetadata(
  userId: string
): Promise<string | null> {
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (error || !user) {
      console.error('Error retrieving user:', error);
      return null;
    }

    const stripeAccountId = (user.user_metadata?.stripe_account_id || user.app_metadata?.stripe_account_id) as string | undefined;
    return stripeAccountId || null;
  } catch (err: any) {
    console.error('Error getting Stripe account ID from metadata:', err);
    return null;
  }
}

/**
 * Verify Stripe account ID is stored in metadata
 */
export async function verifyStripeAccountIdInMetadata(
  userId: string,
  expectedStripeAccountId: string
): Promise<boolean> {
  const storedId = await getStripeAccountIdFromMetadata(userId);
  return storedId === expectedStripeAccountId;
}

/**
 * Clear Stripe account ID from metadata (for cleanup)
 */
export async function clearStripeAccountIdFromMetadata(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user }, error: getError } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (getError || !user) {
      return { success: false, error: 'User not found' };
    }

    // Remove stripe_account_id from metadata
    const updatedMetadata = { ...user.user_metadata };
    delete updatedMetadata.stripe_account_id;

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: updatedMetadata
    });

    if (updateError) {
      console.error('Error clearing Stripe account ID:', updateError);
      return { success: false, error: updateError.message };
    }

    console.log(`Cleared Stripe account ID from metadata for user ${userId}`);
    return { success: true };
  } catch (err: any) {
    console.error('Unexpected error clearing Stripe account ID:', err);
    return { success: false, error: err.message };
  }
}
