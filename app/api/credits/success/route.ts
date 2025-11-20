import { createClient } from '@/lib/supabaseClient';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil'
});

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const sessionId = searchParams.get('session_id');
    const purchaseIdFromUrl = searchParams.get('purchaseId');

    console.log('Credit success route called:', { sessionId, purchaseId: purchaseIdFromUrl });

    if (!sessionId) {
      return NextResponse.redirect(new URL('/credits?error=missing_session', req.url));
    }

    // Get the session from Stripe to verify the purchase
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent']
    });

    if (!session) {
      return NextResponse.redirect(new URL('/credits?error=invalid_session', req.url));
    }

    // CRITICAL: Only process if payment was actually completed
    if (session.payment_status !== 'paid') {
      console.log('Payment not completed:', { sessionId, payment_status: session.payment_status });
      return NextResponse.redirect(new URL('/credits?error=payment_not_completed', req.url));
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get user ID and credits from session metadata
    const userId = session.metadata?.userId;
    const credits = parseInt(session.metadata?.credits || '0');
    const purchaseId = session.metadata?.purchaseId || purchaseIdFromUrl;

    if (!userId || !credits) {
      return NextResponse.redirect(new URL('/credits?error=missing_metadata', req.url));
    }

    // Get the purchase record to get the original amount
    let originalAmount = 0;
    if (purchaseId) {
      const { data: purchaseData, error: purchaseFetchError } = await supabase
        .from('credit_purchases')
        .select('amount, credits')
        .eq('id', purchaseId)
        .single();

      if (!purchaseFetchError && purchaseData) {
        originalAmount = purchaseData.amount;
      }
    }

    // Use the full credits amount (no fee deduction)
    let creditsToAdd = credits;

    // First check if user has a credit account
    const { data: creditAccount, error: creditAccountError } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (creditAccountError && creditAccountError.code !== 'PGRST116') {
      console.error('Error checking credit account:', creditAccountError);
      return NextResponse.json(
        { error: 'Failed to verify credit account' },
        { status: 500 }
      );
    }

    // If no credit account exists, create one
    if (!creditAccount) {
      const { error: createError } = await supabase
        .from('user_credits')
        .insert([{
          user_id: userId,
          purchased_credits: creditsToAdd,
          winnings_credits: 0,
          referral_credits: 0
        }]);

      if (createError) {
        console.error('Error creating credit account:', createError);
        return NextResponse.json(
          { error: 'Failed to create credit account' },
          { status: 500 }
        );
      }
    } else {
      // Update existing credit account
      const { error: updateError } = await supabase
        .from('user_credits')
        .update({
          purchased_credits: creditAccount.purchased_credits + creditsToAdd
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error updating credits:', updateError);
        return NextResponse.json(
          { error: 'Failed to update credit balance' },
          { status: 500 }
        );
      }
    }

    // NOTE: Notification is sent automatically by database trigger when status changes to 'completed'
    // No need to send notification here to avoid duplicates

    // Update transaction status (legacy credit_transactions table)
    const { error: transactionError } = await supabase
      .from('credit_transactions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .match({
        payment_id: sessionId,
        user_id: userId
      });

    if (transactionError) {
      console.error('Error updating transaction:', transactionError);
      // Don't return error since credits were added successfully
    }

    // Update credit purchase status
    if (purchaseId) {
      console.log('Updating credit_purchases with purchaseId:', purchaseId);
      // Try to set payment_id to a value Stripe can use for refunds: prefer
      // payment_intent or the charge id when available, otherwise keep
      // the checkout session id as a fallback.
      const updatePayload: any = {
        status: 'completed',
        credits: creditsToAdd, // Update to actual credits received after fees
        payment_data: session,
        updated_at: new Date().toISOString()
      };

      try {
        if ((session as any).payment_intent) {
          updatePayload.payment_id = (session as any).payment_intent;
        } else if ((session as any).charges && (session as any).charges.data && (session as any).charges.data[0] && (session as any).charges.data[0].id) {
          updatePayload.payment_id = (session as any).charges.data[0].id;
        } else {
          // keep the session id fallback (e.g., cs_...)
          updatePayload.payment_id = session.id;
        }
      } catch (err) {
        console.error('Error extracting payment identifiers from session:', err);
        updatePayload.payment_id = session.id;
      }

      const { error: purchaseError } = await supabase
        .from('credit_purchases')
        .update(updatePayload)
        .eq('id', purchaseId);

      if (purchaseError) {
        console.error('Error updating credit purchase:', purchaseError);
      } else {
        console.log('Successfully updated credit_purchases status to completed');
      }
    } else {
      console.log('No purchaseId found, trying fallback by payment_id:', sessionId);
      // Fallback: try to find purchase by payment_id
      const { error: purchaseError } = await supabase
        .from('credit_purchases')
        .update({
          status: 'completed',
          credits: creditsToAdd, // Update to actual credits received after fees
          payment_data: session,
          updated_at: new Date().toISOString()
        })
        .eq('payment_id', sessionId)
        .eq('user_id', userId);

      if (purchaseError) {
        console.error('Error updating credit purchase (fallback):', purchaseError);
      } else {
        console.log('Successfully updated credit_purchases via fallback');
      }
    }

    return NextResponse.json({
      success: true,
      credits: creditsToAdd,
      userId,
      sessionId
    });
  } catch (error) {
    console.error('Success route error:', error);
    return NextResponse.redirect(new URL('/credits?error=unknown', req.url));
  }
}
