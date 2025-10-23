import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, reason, userId } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid refund amount' }, { status: 400 });
    }

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json({ error: 'Reason is required' }, { status: 400 });
    }

    // Check user's purchased credits
    const { data: credits, error: creditsError } = await supabase
      .from('user_credits')
      .select('purchased_credits')
      .eq('user_id', userId)
      .single();

    if (creditsError || !credits) {
      return NextResponse.json({ error: 'User credits not found' }, { status: 404 });
    }

    if (credits.purchased_credits < amount) {
      return NextResponse.json({ error: 'Insufficient purchased credits' }, { status: 400 });
    }

    // ===== NEW: CHECK KYC VERIFICATION STATUS =====
    // Get user's payment account and KYC status
    const { data: paymentAccount, error: paymentError } = await supabase
      .from('user_payment_accounts')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    // Determine KYC status
    let kycStatus = 'unverified';
    if (paymentAccount?.kyc_status) {
      kycStatus = paymentAccount.kyc_status;
    }

    // If KYC not verified, return error with onboarding link
    if (kycStatus !== 'verified') {
      // If no payment account exists, create one and generate onboarding link
      if (!paymentAccount) {
        return NextResponse.json(
          {
            error: 'KYC verification required',
            kyc_status: 'unverified',
            message: 'You must complete KYC verification before requesting a refund. Please set up your payment account.',
            requires_onboarding: true
          },
          { status: 403 }
        );
      }

      // If account exists but KYC pending or unverified
      return NextResponse.json(
        {
          error: 'KYC verification required',
          kyc_status: kycStatus,
          message: kycStatus === 'pending'
            ? 'Your KYC verification is still pending. Please complete the verification process.'
            : 'Your KYC verification is incomplete. Please complete the verification process.',
          requires_onboarding: true,
          provider_account_id: paymentAccount?.provider_account_id
        },
        { status: 403 }
      );
    }
    // ===== END: KYC CHECK =====

    // ===== NEW: GET ORIGINAL PAYMENT METHOD FROM CREDIT TRANSACTIONS =====
    // Find the payment method used to purchase these credits
    const { data: transactions, error: transError } = await supabase
      .from('credit_transactions')
      .select('payment_method')
      .eq('user_id', userId)
      .eq('credit_type', 'purchased')
      .eq('transaction_type', 'purchase')
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1);

    let paymentMethod = 'stripe'; // Default to stripe
    if (transactions && transactions.length > 0 && transactions[0].payment_method) {
      paymentMethod = transactions[0].payment_method;
    }
    // ===== END: GET PAYMENT METHOD =====

    // Create refund request with KYC status tracking
    // Build insert object with only fields that exist in the table
    const refundInsertData: any = {
      user_id: userId,
      amount,
      reason,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Add optional KYC fields if they exist in the table
    if (kycStatus) refundInsertData.kyc_status = kycStatus;
    if (paymentAccount?.provider_account_id) refundInsertData.provider_account_id = paymentAccount.provider_account_id;
    // Use the actual payment method from purchase history, not the current payment account provider
    refundInsertData.provider = paymentMethod;

    const { data: refund, error: refundError } = await supabase
      .from('refund_requests')
      .insert(refundInsertData)
      .select()
      .single();

    if (refundError) {
      console.error('Refund creation error:', refundError);
      console.error('Refund insert data:', refundInsertData);
      return NextResponse.json({ error: 'Failed to create refund request', details: refundError.message }, { status: 500 });
    }

    // Deduct purchased credits from user's account
    const newPurchasedCredits = credits.purchased_credits - amount;
    const { error: updateError } = await supabase
      .from('user_credits')
      .update({ purchased_credits: newPurchasedCredits })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Credit deduction error:', updateError);
      // Delete the refund request if credit deduction fails
      await supabase.from('refund_requests').delete().eq('id', refund.id);
      return NextResponse.json({ error: 'Failed to process refund request' }, { status: 500 });
    }

    // Log the refund request for audit
    await supabase
      .from('audit_logs')
      .insert({
        action: 'refund_requested',
        user_id: userId,
        details: { refund_id: refund.id, amount, reason, previous_credits: credits.purchased_credits, new_credits: newPurchasedCredits },
        created_at: new Date().toISOString()
      });

    return NextResponse.json(refund, { status: 201 });
  } catch (error) {
    console.error('Refund API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
