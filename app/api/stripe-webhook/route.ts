import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-07-30.basil' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature');
  const buf = await req.arrayBuffer();
  let event;
  try {
    event = stripe.webhooks.constructEvent(Buffer.from(buf), sig!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }
  // Handle checkout session completion (existing behavior)
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any;
    const competition_id = session.metadata.competition_id;
    const user_id = session.metadata.user_id;
    const paid_amount = session.amount_total;
    await supabase.from('competition_registrations').insert({
      competition_id,
      user_id,
      status: 'confirmed',
      paid_amount,
      paid_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    });
  }

  // Handle payout/transfer events to update withdrawals
  try {
    // Handle account updates to keep KYC status in sync
    if (event.type === 'account.updated') {
      try {
        const account = event.data.object as any;
        const acctId = account.id;
        const detailsSubmitted = Boolean(account.details_submitted);
        const currentlyDue = (account.requirements?.currently_due || []).length;
        const payoutsEnabled = Boolean(account.payouts_enabled);

        // Determine kyc status: verified when details submitted, no currently_due items, and payouts enabled
        let kycStatus = 'unverified';
        if (detailsSubmitted && currentlyDue === 0 && payoutsEnabled) kycStatus = 'verified';
        else if (detailsSubmitted) kycStatus = 'pending';

        await supabase.from('user_payment_accounts').update({ kyc_status: kycStatus, metadata: account, updated_at: new Date().toISOString() }).eq('provider_account_id', acctId);
      } catch (acctErr) {
        console.error('Failed to process account.updated webhook', acctErr);
      }
    }

    if (event.type && (event.type.startsWith('payout.') || event.type.startsWith('transfer.'))) {
      const obj = event.data.object as any;

      // For payouts: look up provider_payouts by provider_payout_id or withdrawals by provider_payout_id
      if (event.type === 'payout.paid') {
        const payoutId = obj.id;
        // update provider_payouts and withdrawals
        await supabase.from('provider_payouts').update({ status: 'paid', response: obj, updated_at: new Date().toISOString() }).eq('provider_payout_id', payoutId);
        // update corresponding withdrawal
        await supabase.from('withdrawals').update({ status: 'paid', provider_payout_id: payoutId, provider_response: obj, paid_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('provider_payout_id', payoutId);
      }

      if (event.type === 'payout.failed') {
        const payoutId = obj.id;
        await supabase.from('provider_payouts').update({ status: 'failed', response: obj, updated_at: new Date().toISOString() }).eq('provider_payout_id', payoutId);
        await supabase.from('withdrawals').update({ status: 'payout_failed', provider_response: obj, updated_at: new Date().toISOString() }).eq('provider_payout_id', payoutId);
      }

      const evType = String(event.type);
      if (evType === 'transfer.paid' || evType === 'transfer.failed') {
        const transferId = obj.id;
        // transfers might be stored in provider_payouts.response or provider_response.transfer
        await supabase.from('provider_payouts').update({ response: obj, updated_at: new Date().toISOString() }).eq('response->>id', transferId);
        // No general update to withdrawals here unless your app stores transfer id
      }
    }
  } catch (err) {
    console.error('Error reconciling payout webhook', err);
  }
  return NextResponse.json({ received: true });
}
