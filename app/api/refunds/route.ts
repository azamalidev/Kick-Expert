import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { verifyKycBeforeTransaction } from '../utils/kyc-sync';

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

    const { amount, reason, userId, purchaseId } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid refund amount' }, { status: 400 });
    }

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json({ error: 'Reason is required' }, { status: 400 });
    }

    if (!purchaseId) {
      return NextResponse.json({ error: 'Purchase ID is required' }, { status: 400 });
    }

    // Verify purchase exists and belongs to user
    const { data: purchase, error: purchaseError } = await supabase
      .from('credit_purchases')
      .select('*')
      .eq('id', purchaseId)
      .eq('user_id', userId)
      .eq('status', 'completed')
      .single();

    if (purchaseError || !purchase) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
    }

    // Check if purchase is within 7 days
    const purchaseDate = new Date(purchase.created_at);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    if (purchaseDate < sevenDaysAgo) {
      return NextResponse.json({ error: 'Refunds are only available within 7 days of purchase' }, { status: 400 });
    }

    // Calculate already refunded amount for this purchase using the new
    // `purchase_id` column (more reliable than JSON metadata parsing).
    const { data: existingRefunds, error: existingRefundsError } = await supabase
      .from('refund_requests')
      .select('amount')
      .eq('purchase_id', purchaseId)
      .in('status', ['pending', 'approved', 'completed']);

    if (existingRefundsError) {
      console.error('Error fetching existing refunds by purchase_id:', existingRefundsError);
      return NextResponse.json({ error: 'Failed to verify existing refunds' }, { status: 500 });
    }

    const refundedAmount = (existingRefunds || []).reduce((sum, r) => sum + (r.amount || 0), 0);
    const remainingRefundable = purchase.credits - refundedAmount;

    if (amount > remainingRefundable) {
      return NextResponse.json({ 
        error: `Only ${remainingRefundable} credits are refundable from this transaction` 
      }, { status: 400 });
    }

    // Check user's purchased credits (total available)
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

    // ===== VERIFY KYC WITH REAL-TIME STRIPE SYNC =====
    const kycVerification = await verifyKycBeforeTransaction(userId, 'refund');
    if (!kycVerification.verified) {
      return NextResponse.json(
        {
          error: kycVerification.error,
          kyc_status: kycVerification.kyc_status,
          message: kycVerification.message,
          requires_onboarding: true
        },
        { status: 403 }
      );
    }
    // ===== END: KYC VERIFICATION =====

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
    if (kycVerification.kyc_status) refundInsertData.kyc_status = kycVerification.kyc_status;
    // Use the payment provider from the purchase record
    refundInsertData.provider = purchase.payment_provider;
    
    // Store purchase_id and payment_id in metadata field (JSON) to track the relationship
    // This avoids adding new columns while maintaining the link
    // Enrich metadata with payment identifiers we can use to match webhooks
    const metadata: any = {
      purchase_id: purchaseId,
      payment_id: purchase.payment_id,
      credits_purchased: purchase.credits,
      purchase_date: purchase.created_at
    };

    try {
      const pd = purchase.payment_data;
      if (pd) {
        // Checkout session often contains payment_intent and may include charges
        if (pd.payment_intent) metadata.payment_intent = pd.payment_intent;
        if (pd.charges && pd.charges.data && pd.charges.data[0] && pd.charges.data[0].id) {
          metadata.stripe_charge_id = pd.charges.data[0].id;
        }
      }
    } catch (err) {
      console.error('Error reading payment_data for metadata enrichment:', err);
    }

  // Also write a proper purchase_id column to avoid JSON-only linkage
  refundInsertData.purchase_id = purchaseId;
  refundInsertData.metadata = metadata;

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
