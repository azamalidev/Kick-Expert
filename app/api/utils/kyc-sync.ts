/**
 * KYC Verification Sync Utility
 * 
 * This module handles real-time KYC verification syncing between Stripe and local database.
 * It ensures that if a user has KYC verified on Stripe but not in the local DB, we sync it.
 */

import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

const supabaseAdmin = createClient(SUPABASE_URL || '', SERVICE_ROLE_KEY || '', {
  auth: { persistSession: false }
});

const stripe = new Stripe(STRIPE_SECRET_KEY || '');

/**
 * Determine KYC status from Stripe account data
 */
function determineKycStatusFromStripe(account: Stripe.Account): 'verified' | 'pending' | 'unverified' {
  // Check if all requirements are met
  const detailsSubmitted = account.details_submitted === true;
  const currentlyDue = account.requirements?.currently_due || [];
  const payoutsEnabled = account.payouts_enabled === true;

  // Verified: All details submitted, no requirements pending, payouts enabled
  if (detailsSubmitted && currentlyDue.length === 0 && payoutsEnabled) {
    return 'verified';
  }

  // Pending: Details submitted but still has requirements
  if (detailsSubmitted && currentlyDue.length > 0) {
    return 'pending';
  }

  // Unverified: Details not submitted or account not ready
  return 'unverified';
}

/**
 * Sync KYC status from Stripe to local database
 * 
 * This function:
 * 1. Checks if user has a Stripe connected account
 * 2. Fetches current KYC status from Stripe
 * 3. Compares with local DB
 * 4. Updates local DB if Stripe status is more recent/verified
 * 5. Returns the verified status
 */
export async function syncKycStatusFromStripe(
  userId: string,
  forceRefresh: boolean = false
): Promise<{
  kyc_status: 'verified' | 'pending' | 'unverified';
  provider_account_id: string | null;
  synced: boolean;
  message: string;
}> {
  try {
    // Step 1: Get user's payment account from local DB
    const { data: paymentAccount, error: dbError } = await supabaseAdmin
      .from('user_payment_accounts')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (dbError) {
      console.error('Error fetching payment account:', dbError);
      return {
        kyc_status: 'unverified',
        provider_account_id: null,
        synced: false,
        message: 'Failed to fetch payment account'
      };
    }

    // Step 2: If no payment account exists, check user metadata for Stripe account ID
    if (!paymentAccount) {
      // Try to retrieve Stripe account ID from user metadata
      // This handles the case where KYC data was deleted from local DB
      // but the Stripe account ID is stored in user metadata
      try {
        const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
        
        if (userError || !user) {
          return {
            kyc_status: 'unverified',
            provider_account_id: null,
            synced: false,
            message: 'User not found'
          };
        }

        // Check if Stripe account ID is stored in user metadata
        const stripeAccountIdFromMetadata = (user.user_metadata?.stripe_account_id || user.app_metadata?.stripe_account_id) as string | undefined;
        
        if (!stripeAccountIdFromMetadata) {
          return {
            kyc_status: 'unverified',
            provider_account_id: null,
            synced: false,
            message: 'No payment account found'
          };
        }

        // Found Stripe account ID in metadata, fetch its status
        console.log(`Found Stripe account ID in user metadata: ${stripeAccountIdFromMetadata}`);
        
        let stripeAccount: Stripe.Account;
        try {
          stripeAccount = await stripe.accounts.retrieve(stripeAccountIdFromMetadata);
        } catch (stripeError: any) {
          console.error('Error fetching Stripe account:', stripeError);
          return {
            kyc_status: 'unverified',
            provider_account_id: stripeAccountIdFromMetadata,
            synced: false,
            message: 'Failed to fetch Stripe account'
          };
        }

        // Determine KYC status from Stripe
        const stripeKycStatus = determineKycStatusFromStripe(stripeAccount);

        // Recreate payment account record in DB
        try {
          const { error: insertError } = await supabaseAdmin
            .from('user_payment_accounts')
            .insert({
              user_id: userId,
              provider: 'stripe',
              provider_account_id: stripeAccountIdFromMetadata,
              kyc_status: stripeKycStatus,
              metadata: {
                last_synced_at: new Date().toISOString(),
                stripe_details_submitted: stripeAccount.details_submitted,
                stripe_payouts_enabled: stripeAccount.payouts_enabled,
                stripe_currently_due: stripeAccount.requirements?.currently_due || [],
                recreated_from_metadata: true
              },
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (insertError) {
            console.error('Error recreating payment account:', insertError);
          }
        } catch (err: any) {
          console.error('Error in payment account recreation:', err);
        }

        return {
          kyc_status: stripeKycStatus,
          provider_account_id: stripeAccountIdFromMetadata,
          synced: true,
          message: `Payment account recovered from metadata and synced: ${stripeKycStatus}`
        };
      } catch (err: any) {
        console.error('Error handling missing payment account:', err);
        return {
          kyc_status: 'unverified',
          provider_account_id: null,
          synced: false,
          message: 'Error retrieving payment account information'
        };
      }
    }

    // Step 3: If not Stripe provider, return current status
    if (paymentAccount.provider !== 'stripe') {
      return {
        kyc_status: paymentAccount.kyc_status || 'unverified',
        provider_account_id: paymentAccount.provider_account_id,
        synced: false,
        message: 'Non-Stripe provider'
      };
    }

    // Step 4: Get Stripe account ID
    const stripeAccountId = paymentAccount.provider_account_id;
    if (!stripeAccountId) {
      return {
        kyc_status: 'unverified',
        provider_account_id: null,
        synced: false,
        message: 'No Stripe account ID found'
      };
    }

    // Step 5: Fetch current Stripe account status
    let stripeAccount: Stripe.Account;
    try {
      stripeAccount = await stripe.accounts.retrieve(stripeAccountId);
    } catch (stripeError: any) {
      console.error('Error fetching Stripe account:', stripeError);
      return {
        kyc_status: paymentAccount.kyc_status || 'unverified',
        provider_account_id: stripeAccountId,
        synced: false,
        message: 'Failed to fetch Stripe account'
      };
    }

    // Step 6: Determine KYC status from Stripe
    const stripeKycStatus = determineKycStatusFromStripe(stripeAccount);
    const localKycStatus = paymentAccount.kyc_status || 'unverified';

    // Step 7: Check if we need to update local DB
    let needsUpdate = false;
    let updateReason = '';

    if (forceRefresh) {
      needsUpdate = true;
      updateReason = 'Force refresh requested';
    } else if (stripeKycStatus === 'verified' && localKycStatus !== 'verified') {
      // Stripe shows verified but local DB doesn't
      needsUpdate = true;
      updateReason = 'Stripe shows verified, syncing to local DB';
    } else if (stripeKycStatus === 'pending' && localKycStatus === 'unverified') {
      // Stripe shows pending but local DB shows unverified
      needsUpdate = true;
      updateReason = 'Stripe shows pending, syncing to local DB';
    }

    // Step 8: Update local DB if needed
    if (needsUpdate) {
      const { error: updateError } = await supabaseAdmin
        .from('user_payment_accounts')
        .update({
          kyc_status: stripeKycStatus,
          metadata: {
            ...paymentAccount.metadata,
            last_synced_at: new Date().toISOString(),
            stripe_details_submitted: stripeAccount.details_submitted,
            stripe_payouts_enabled: stripeAccount.payouts_enabled,
            stripe_currently_due: stripeAccount.requirements?.currently_due || []
          },
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error updating KYC status:', updateError);
        return {
          kyc_status: stripeKycStatus,
          provider_account_id: stripeAccountId,
          synced: false,
          message: `Failed to update local DB: ${updateError.message}`
        };
      }

      // Log the sync action
      try {
        await supabaseAdmin
          .from('audit_logs')
          .insert({
            action: 'kyc_synced_from_stripe',
            user_id: userId,
            details: {
              previous_status: localKycStatus,
              new_status: stripeKycStatus,
              reason: updateReason,
              stripe_account_id: stripeAccountId
            },
            created_at: new Date().toISOString()
          });
      } catch (logErr: any) {
        console.error('Failed to log KYC sync:', logErr);
      }

      return {
        kyc_status: stripeKycStatus,
        provider_account_id: stripeAccountId,
        synced: true,
        message: `KYC status synced: ${updateReason}`
      };
    }

    // Step 9: No update needed, return current status
    return {
      kyc_status: localKycStatus,
      provider_account_id: stripeAccountId,
      synced: false,
      message: 'KYC status already up to date'
    };
  } catch (error: any) {
    console.error('Unexpected error in syncKycStatusFromStripe:', error);
    return {
      kyc_status: 'unverified',
      provider_account_id: null,
      synced: false,
      message: `Unexpected error: ${error.message}`
    };
  }
}

/**
 * Verify KYC before withdrawal/refund
 * 
 * This function:
 * 1. Syncs KYC status from Stripe
 * 2. Checks if KYC is verified
 * 3. Returns appropriate error if not verified
 */
export async function verifyKycBeforeTransaction(
  userId: string,
  transactionType: 'withdrawal' | 'refund'
): Promise<{
  verified: boolean;
  kyc_status: 'verified' | 'pending' | 'unverified';
  error?: string;
  message?: string;
}> {
  try {
    // Sync KYC status from Stripe
    const syncResult = await syncKycStatusFromStripe(userId, false);

    // Check if verified
    if (syncResult.kyc_status === 'verified') {
      return {
        verified: true,
        kyc_status: 'verified',
        message: 'KYC verification confirmed'
      };
    }

    // Not verified
    const errorMessage =
      syncResult.kyc_status === 'pending'
        ? `Your KYC verification is still pending. Please complete the verification process.`
        : `You must complete KYC verification before requesting a ${transactionType}.`;

    return {
      verified: false,
      kyc_status: syncResult.kyc_status,
      error: 'KYC verification required',
      message: errorMessage
    };
  } catch (error: any) {
    console.error('Error verifying KYC:', error);
    return {
      verified: false,
      kyc_status: 'unverified',
      error: 'Failed to verify KYC',
      message: 'An error occurred while verifying your KYC status. Please try again.'
    };
  }
}

/**
 * Get KYC status with real-time Stripe sync
 * 
 * This is the main function to call when you need to check KYC status
 */
export async function getKycStatusWithSync(userId: string): Promise<{
  kyc_status: 'verified' | 'pending' | 'unverified';
  provider_account_id: string | null;
  provider: string | null;
  synced: boolean;
  message: string;
}> {
  const syncResult = await syncKycStatusFromStripe(userId, false);

  return {
    kyc_status: syncResult.kyc_status,
    provider_account_id: syncResult.provider_account_id,
    provider: syncResult.provider_account_id ? 'stripe' : null,
    synced: syncResult.synced,
    message: syncResult.message
  };
}
