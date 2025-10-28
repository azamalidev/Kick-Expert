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
    // ===== HANDLE REFUND EVENTS =====
    if (event.type === 'charge.refund.updated') {
      try {
        const refund = event.data.object as any;
        console.log('Refund webhook received:', {
          refund_id: refund.id,
          charge_id: refund.charge,
          amount: refund.amount,
          status: refund.status,
          reason: refund.reason
        });

        // Find the refund request by matching several possible identifiers that
        // may be stored in `metadata` (checkout session id, payment_intent,
        // stripe charge id, or stripe_refund_id). Historically we stored the
        // checkout session id in metadata.payment_id which does NOT match the
        // Stripe refund.charge value, so try multiple fields and fall back to
        // parsing metadata in JS if needed.
        let refundRequests: any[] = [];

        try {
          const orQueryParts: string[] = [];
          if (refund.charge) orQueryParts.push(`metadata->>stripe_charge_id.eq.${refund.charge}`);
          if (refund.charge) orQueryParts.push(`metadata->>payment_id.eq.${refund.charge}`);
          if ((refund as any).payment_intent) orQueryParts.push(`metadata->>payment_intent.eq.${(refund as any).payment_intent}`);
          if (refund.id) orQueryParts.push(`metadata->>stripe_refund_id.eq.${refund.id}`);

          if (orQueryParts.length > 0) {
            const orQuery = orQueryParts.join(',');
            const { data: matched } = await supabase
              .from('refund_requests')
              .select('*')
              .or(orQuery);

            if (matched && matched.length > 0) {
              refundRequests = matched;
            }
          }
        } catch (searchErr) {
          console.error('Error querying refund_requests by metadata keys:', searchErr);
        }

        // If no matches found yet, fall back to scanning recent refund_requests
        // and compare metadata.purchase_id -> purchase.payment_data to locate
        // the matching purchase/charge.
        if (refundRequests.length === 0) {
          try {
            const { data: candidates } = await supabase
              .from('refund_requests')
              .select('id, user_id, amount, status, metadata')
              .order('created_at', { ascending: false })
              .limit(200);

            if (candidates && candidates.length > 0) {
              // Parse metadata and try to match by purchase -> payment_data
              for (const cand of candidates) {
                try {
                  const metadata = typeof cand.metadata === 'string' ? JSON.parse(cand.metadata) : cand.metadata;
                  if (metadata?.purchase_id) {
                    const { data: purchase } = await supabase
                      .from('credit_purchases')
                      .select('payment_id, payment_data')
                      .eq('id', metadata.purchase_id)
                      .single();

                    // Determine a charge id from purchase.payment_data if possible
                    let purchaseChargeId: string | null = null;
                    if (purchase?.payment_data) {
                      const pd = purchase.payment_data;
                      // payment_intent may be present
                      if (pd.payment_intent) purchaseChargeId = pd.payment_intent;
                      // try to get actual charge id if Stripe session includes it
                      if (pd?.charges?.data && pd.charges.data[0]?.id) purchaseChargeId = pd.charges.data[0].id;
                    }

                    if (purchaseChargeId && String(purchaseChargeId) === String(refund.charge)) {
                      refundRequests.push(cand);
                      break;
                    }
                  }
                } catch (innerErr) {
                  console.error('Error parsing candidate metadata/purchase:', innerErr);
                }
              }
            }
          } catch (scanErr) {
            console.error('Error scanning refund_requests for matching metadata:', scanErr);
          }
        }

        if (refundRequests && refundRequests.length > 0) {
          // Update refund status based on Stripe status
          let dbStatus = 'processing';
          if (refund.status === 'succeeded') dbStatus = 'completed';
          else if (refund.status === 'failed') dbStatus = 'failed';
          else if (refund.status === 'canceled') dbStatus = 'cancelled';

          for (const refundRequest of refundRequests) {
            // Only update if not already in a terminal state
            if (!['completed', 'failed', 'cancelled'].includes(refundRequest.status)) {
              await supabase
                .from('refund_requests')
                .update({
                  status: dbStatus,
                  updated_at: new Date().toISOString()
                })
                .eq('id', refundRequest.id);

              // Notify user of status change
              if (dbStatus === 'completed') {
                await supabase.from('notifications').insert({
                  user_id: refundRequest.user_id,
                  type: 'refund_completed',
                  title: 'Refund Completed',
                  message: `Your refund of ${refundRequest.amount} credits has been successfully processed by Stripe.`,
                  created_at: new Date().toISOString()
                });
              } else if (dbStatus === 'failed') {
                await supabase.from('notifications').insert({
                  user_id: refundRequest.user_id,
                  type: 'refund_failed',
                  title: 'Refund Failed',
                  message: `Your refund of ${refundRequest.amount} credits could not be processed. Please contact support.`,
                  created_at: new Date().toISOString()
                });
              }

              // Log the webhook event
              await supabase.from('audit_logs').insert({
                action: 'stripe_refund_webhook',
                user_id: refundRequest.user_id,
                details: {
                  refund_id: refundRequest.id,
                  stripe_refund_id: refund.id,
                  old_status: refundRequest.status,
                  new_status: dbStatus,
                  stripe_status: refund.status,
                  webhook_event: event.type
                },
                created_at: new Date().toISOString()
              });
            }
          }
        }
      } catch (refundErr) {
        console.error('Failed to process refund webhook:', refundErr);
      }
    }
    // ===== END REFUND EVENTS =====

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

      // ===== HANDLE PAYOUT EVENTS (WITHDRAWALS) =====
      // For payouts: look up provider_payouts by provider_payout_id or withdrawals by provider_payout_id
      if (event.type === 'payout.paid') {
        const payoutId = obj.id;
        console.log('Payout paid webhook received:', {
          payout_id: payoutId,
          amount: obj.amount,
          arrival_date: obj.arrival_date,
          status: obj.status
        });

        // update provider_payouts and withdrawals
        await supabase.from('provider_payouts').update({ status: 'paid', response: obj, updated_at: new Date().toISOString() }).eq('provider_payout_id', payoutId);
        
        // update corresponding withdrawal
        const { data: withdrawal, error: withdrawalErr } = await supabase
          .from('withdrawals')
          .update({ 
            status: 'paid', 
            provider_payout_id: payoutId, 
            provider_response: obj, 
            paid_at: new Date().toISOString(), 
            updated_at: new Date().toISOString() 
          })
          .eq('provider_payout_id', payoutId)
          .select()
          .single();

        if (!withdrawalErr && withdrawal) {
          // Notify user that withdrawal was successfully paid
          await supabase.from('notifications').insert({
            user_id: withdrawal.user_id,
            type: 'withdrawal_paid',
            title: 'Withdrawal Completed',
            message: `Your withdrawal of ${withdrawal.amount} ${withdrawal.currency || 'USD'} has been successfully processed and sent to your account.`,
            created_at: new Date().toISOString()
          });

          // Log to audit trail
          await supabase.from('audit_logs').insert({
            action: 'stripe_payout_webhook_paid',
            user_id: withdrawal.user_id,
            details: {
              withdrawal_id: withdrawal.id,
              payout_id: payoutId,
              amount: withdrawal.amount,
              status: 'paid',
              webhook_event: event.type
            },
            created_at: new Date().toISOString()
          });
        }
      }

      if (event.type === 'payout.failed') {
        const payoutId = obj.id;
        console.log('Payout failed webhook received:', {
          payout_id: payoutId,
          amount: obj.amount,
          failure_code: obj.failure_code,
          failure_message: obj.failure_message
        });

        await supabase.from('provider_payouts').update({ status: 'failed', response: obj, updated_at: new Date().toISOString() }).eq('provider_payout_id', payoutId);
        
        // update corresponding withdrawal
        const { data: withdrawal, error: withdrawalErr } = await supabase
          .from('withdrawals')
          .update({ 
            status: 'payout_failed', 
            provider_response: obj, 
            updated_at: new Date().toISOString() 
          })
          .eq('provider_payout_id', payoutId)
          .select()
          .single();

        if (!withdrawalErr && withdrawal) {
          // Notify user that withdrawal failed
          await supabase.from('notifications').insert({
            user_id: withdrawal.user_id,
            type: 'withdrawal_failed',
            title: 'Withdrawal Failed',
            message: `Your withdrawal of ${withdrawal.amount} ${withdrawal.currency || 'USD'} could not be processed. Reason: ${obj.failure_message || 'Unknown error'}. Please contact support.`,
            created_at: new Date().toISOString()
          });

          // Log to audit trail
          await supabase.from('audit_logs').insert({
            action: 'stripe_payout_webhook_failed',
            user_id: withdrawal.user_id,
            details: {
              withdrawal_id: withdrawal.id,
              payout_id: payoutId,
              amount: withdrawal.amount,
              status: 'failed',
              failure_code: obj.failure_code,
              failure_message: obj.failure_message,
              webhook_event: event.type
            },
            created_at: new Date().toISOString()
          });
        }
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
