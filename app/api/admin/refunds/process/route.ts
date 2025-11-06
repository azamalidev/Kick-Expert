import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

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

    // Check if user is admin
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (adminError || adminUser?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { refund_id } = await request.json();
    console.log('\n===== REFUND PROCESSING STARTED =====' );
    console.log('Refund ID:', refund_id);

    if (!refund_id) {
      console.error('Refund ID is required');
      return NextResponse.json({ error: 'Refund ID is required' }, { status: 400 });
    }

    // Get refund details
    const { data: refund, error: refundError } = await supabase
      .from('refund_requests')
      .select('*')
      .eq('id', refund_id)
      .single();

    console.log('Refund details fetched:', refund);

    if (refundError || !refund) {
      console.error('Refund not found:', refundError);
      return NextResponse.json({ error: 'Refund not found' }, { status: 404 });
    }

    if (refund.status !== 'approved') {
      console.error('Refund status is not approved:', refund.status);
      return NextResponse.json(
        { error: 'Refund must be approved before processing' },
        { status: 400 }
      );
    }
    
    console.log('Refund status verified as approved');

    // Get the original payment transaction - now from metadata or purchase lookup
    let chargeId = null;
    
    // First try to get from metadata (new approach without schema changes)
    try {
      const metadata = typeof refund.metadata === 'string' 
        ? JSON.parse(refund.metadata) 
        : refund.metadata;
      
      // Prefer explicit charge/payment identifiers when present
      if (metadata?.stripe_charge_id) {
        chargeId = metadata.stripe_charge_id;
        console.log('Found stripe_charge_id from metadata:', chargeId);
      } else if (metadata?.payment_intent) {
        chargeId = metadata.payment_intent;
        console.log('Found payment_intent from metadata:', chargeId);
      } else if (metadata?.payment_id) {
        // Avoid using a Checkout Session id (cs_...) as a charge id; if
        // payment_id appears to be a session id, defer to purchase.payment_data
        const pid = String(metadata.payment_id);
        if (!pid.startsWith('cs_') && !pid.startsWith('sess_')) {
          chargeId = pid;
          console.log('Found payment_id from metadata (used as charge):', chargeId);
        } else {
          console.log('metadata.payment_id looks like a checkout session id; will attempt purchase.payment_data lookup');
        }
      }

      // If metadata has purchase_id, try to get payment details from purchase
      if (!chargeId && metadata?.purchase_id) {
        const { data: purchase } = await supabase
          .from('credit_purchases')
          .select('payment_id, payment_data')
          .eq('id', metadata.purchase_id)
          .single();
        
        if (purchase?.payment_id) {
          chargeId = purchase.payment_id;
          console.log('Found payment_id from purchase:', chargeId);
          
          // For Stripe, we need the actual charge ID from the session
          if (purchase.payment_data?.payment_intent) {
            chargeId = purchase.payment_data.payment_intent;
          }
        }
      }
    } catch (metadataError) {
      console.error('Error parsing metadata:', metadataError);
    }
    
    // Fallback to old method if still no charge ID
    if (!chargeId) {
      console.log('Falling back to credit_transactions lookup');
      const { data: originalTransaction, error: transError } = await supabase
        .from('credit_transactions')
        .select('payment_id')
        .eq('user_id', refund.user_id)
        .eq('credit_type', 'purchased')
        .eq('transaction_type', 'purchase')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (transError || !originalTransaction?.payment_id) {
        console.error('Original transaction not found:', transError);
        return NextResponse.json(
          { error: 'Original payment transaction not found' },
          { status: 404 }
        );
      }
      chargeId = originalTransaction.payment_id;
    }
    console.log('Original charge/capture ID:', chargeId);
    
    let refundResult: any = null;
    let refundStatus = 'failed';
    let refundProvider = refund.provider || 'stripe';
    console.log('Refund provider:', refundProvider);
    console.log('Refund amount:', refund.amount);

    try {
      // ===== STRIPE REFUND PROCESSING =====
      if (refundProvider === 'stripe') {
        console.log(`\n>>> Processing Stripe refund for charge: ${chargeId}`);
        console.log('Refund amount in cents:', Math.round(refund.amount * 100));

        // Create refund in Stripe. Use the correct parameter depending on the
        // identifier we have: if we have a payment_intent (pi_...) pass
        // `payment_intent`, otherwise pass `charge` for a charge id (ch_...).
        const refundParams: any = {
          amount: Math.round(refund.amount * 100), // Convert to cents
          reason: 'requested_by_customer'
        };

        if (String(chargeId).startsWith('pi_')) {
          // Refund by payment_intent
          refundParams.payment_intent = chargeId;
        } else {
          // Assume it's a charge id
          refundParams.charge = chargeId;
        }

        const stripeRefund = await stripe.refunds.create(refundParams);

        refundResult = {
          provider: 'stripe',
          refund_id: stripeRefund.id,
          charge_id: chargeId,
          amount: refund.amount,
          status: stripeRefund.status,
          created: stripeRefund.created,
          metadata: {
            stripe_refund_id: stripeRefund.id,
            stripe_charge_id: chargeId,
            reason: 'requested_by_customer'
          }
        };

        // ===== WEBHOOK-BASED STATUS =====
        // Mark as 'processing' and let webhook update to 'completed' or 'failed'
        // This ensures accurate tracking via Stripe's async processing
        if (stripeRefund.status === 'succeeded') {
          // Even if Stripe reports immediate success, use 'processing'
          // Webhook will confirm actual completion
          refundStatus = 'processing';
          console.log('⚠️  Stripe refund succeeded immediately, but marking as processing for webhook confirmation');
        } else if (stripeRefund.status === 'pending') {
          refundStatus = 'processing';
          console.log('✅ Stripe refund pending, marked as processing - waiting for webhook');
        } else if (stripeRefund.status === 'failed') {
          refundStatus = 'failed';
          console.log('❌ Stripe refund failed immediately');
        } else {
          refundStatus = 'processing';
          console.log('⚠️  Unknown Stripe status, defaulting to processing');
        }

        console.log(`Stripe refund result:`, refundResult);
      }
      // ===== PAYPAL REFUND PROCESSING =====
      else if (refundProvider === 'paypal') {
        console.log(`Processing PayPal refund for transaction: ${chargeId}`);

        // Get PayPal access token
        const tokenResponse = await fetch('https://api-m.paypal.com/v1/oauth2/token', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${Buffer.from(
              `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
            ).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: 'grant_type=client_credentials'
        });

        if (!tokenResponse.ok) {
          throw new Error('Failed to get PayPal access token');
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        // Create refund in PayPal
        const paypalRefundResponse = await fetch(
          `https://api-m.paypal.com/v2/payments/captures/${chargeId}/refund`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              amount: {
                value: refund.amount.toString(),
                currency_code: 'EUR'
              },
              note_to_payer: 'Refund requested by customer'
            })
          }
        );

        if (!paypalRefundResponse.ok) {
          const errorData = await paypalRefundResponse.json();
          throw new Error(`PayPal refund failed: ${errorData.message}`);
        }

        const paypalRefund = await paypalRefundResponse.json();

        refundResult = {
          provider: 'paypal',
          refund_id: paypalRefund.id,
          capture_id: chargeId,
          amount: refund.amount,
          status: paypalRefund.status,
          links: paypalRefund.links,
          metadata: {
            paypal_refund_id: paypalRefund.id,
            paypal_capture_id: chargeId
          }
        };

        // Check if refund was successful
        if (paypalRefund.status === 'COMPLETED') {
          refundStatus = 'completed';
        } else if (paypalRefund.status === 'PENDING') {
          refundStatus = 'processing';
        } else {
          refundStatus = 'failed';
        }

        console.log(`PayPal refund result:`, refundResult);
      }
    } catch (paymentError) {
      console.error('Payment processing error:', paymentError);
      refundStatus = 'failed';
      refundResult = {
        error: paymentError instanceof Error ? paymentError.message : 'Unknown error',
        provider: refundProvider
      };
    }

    // ===== UPDATE REFUND REQUEST STATUS =====
    console.log('\n>>> Updating refund status to:', refundStatus);
    const { error: updateError } = await supabase
      .from('refund_requests')
      .update({
        status: refundStatus,
        metadata: {
          ...refund.metadata,
          stripe_refund_id: refundResult?.refund_id,
          refund_provider: refundProvider,
          refund_result: refundResult
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', refund_id);

    if (updateError) {
      console.error('Failed to update refund status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update refund status' },
        { status: 500 }
      );
    }
    console.log('Refund status updated successfully');

    // ===== CREATE REFUND TRANSACTION RECORD =====
    // Insert refund transaction record. Some deployments may not have a
    // `completed_at` column in the `credit_transactions` table, so avoid
    // writing it to prevent schema cache errors; other code paths update
    // completion time when status becomes completed.
    try {
      const { error: transactionError } = await supabase
        .from('credit_transactions')
        .insert({
          user_id: refund.user_id,
          amount: refund.amount,
          credit_type: 'purchased',
          transaction_type: 'refund',
          payment_method: refundProvider,
          payment_id: refundResult?.refund_id || null,
          status: refundStatus === 'completed' ? 'completed' : 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (transactionError) {
        console.error('Failed to create refund transaction:', transactionError);
      }
    } catch (txErr) {
      console.error('Unexpected error creating refund transaction:', txErr);
    }

    // ===== LOG THE REFUND PROCESSING =====
    await supabase
      .from('audit_logs')
      .insert({
        action: 'refund_processed',
        user_id: user.id,
        details: {
          refund_id,
          amount: refund.amount,
          user_id: refund.user_id,
          provider: refundProvider,
          status: refundStatus,
          refund_result: refundResult
        },
        created_at: new Date().toISOString()
      });

    // ===== NOTIFY USER =====
    const statusMessages: { [key: string]: string } = {
      completed: `Your refund of ${refund.amount} credits has been successfully processed and will appear in your ${refundProvider === 'stripe' ? 'bank account' : 'PayPal account'} within 5-10 business days.`,
      processing: `Your refund of ${refund.amount} credits is being processed by ${refundProvider === 'stripe' ? 'Stripe' : 'PayPal'}. You will be notified when it's completed (typically 5-10 business days).`,
      failed: `Your refund of ${refund.amount} credits could not be processed. Please contact support for assistance.`
    };

    // Only send notification for processing state (webhook will send completion notification)
    if (refundStatus === 'processing') {
      await supabase
        .from('notifications')
        .insert({
          user_id: refund.user_id,
          type: 'refund_processing',
          title: 'Refund Processing',
          message: statusMessages[refundStatus],
          created_at: new Date().toISOString()
        });
      console.log('✉️  User notified: Refund is processing');
    } else if (refundStatus === 'failed') {
      // Send immediate notification for failures
      await supabase
        .from('notifications')
        .insert({
          user_id: refund.user_id,
          type: 'refund_failed',
          title: 'Refund Failed',
          message: statusMessages[refundStatus],
          created_at: new Date().toISOString()
        });
      console.log('✉️  User notified: Refund failed');
    }
    // For 'completed' status, webhook will send the notification

    console.log('\n===== REFUND PROCESSING COMPLETED =====' );
    console.log('Final status:', refundStatus);
    console.log('Refund result:', refundResult);
    console.log('User notified:', refund.user_id);
    console.log('=====================================\n');

    return NextResponse.json({
      success: true,
      refund_id,
      status: refundStatus,
      refund_result: refundResult
    });
  } catch (error) {
    console.error('Refund processing API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
