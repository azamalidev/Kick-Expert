import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

const stripe = STRIPE_SECRET ? new Stripe(STRIPE_SECRET, { apiVersion: '2025-07-30.basil', typescript: true }) : null;

const supabaseAdmin = createClient(SUPABASE_URL || '', SERVICE_ROLE_KEY || '', { auth: { persistSession: false } });

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const token = authHeader.split(' ')[1];

    const { data: { user }, error: userErr } = await supabaseAdmin.auth.getUser(token as string);
    if (userErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // check admin role
    const { data: dbUser } = await supabaseAdmin.from('users').select('id,role').eq('id', user.id).single();
    if (!dbUser || (dbUser as any).role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Extract withdrawal id from the request URL: /api/admin/withdrawals/:id/approve
    let withdrawalId: string | undefined = undefined;
    try {
      const url = new URL(req.url);
      const segments = url.pathname.split('/').filter(Boolean);
      // expect [..., 'api', 'admin', 'withdrawals', '{id}', 'approve']
      if (segments.length >= 2) withdrawalId = segments[segments.length - 2];
    } catch (e) {
      console.warn('Could not parse request URL for withdrawal id', e);
    }
  if (!withdrawalId) return NextResponse.json({ error: 'Missing withdrawal id' }, { status: 400 });
    // fetch withdrawal
    const { data: w, error: wErr } = await supabaseAdmin.from('withdrawals').select('*').eq('id', withdrawalId).single();
    if (wErr || !w) return NextResponse.json({ error: 'Withdrawal not found' }, { status: 404 });
    if (w.status !== 'pending') return NextResponse.json({ error: 'Withdrawal not in pending state' }, { status: 400 });

    // If provider or provider_account missing on the withdrawal, try to fill from user_payment_accounts
    let provider = (w as any).provider as string | null;
    let provider_account = (w as any).provider_account as string | null;

    try {
      if (!provider || !provider_account) {
        const { data: upa } = await supabaseAdmin.from('user_payment_accounts').select('*').eq('user_id', (w as any).user_id).maybeSingle();
        if (upa) {
          provider = provider || (upa as any).provider || 'stripe';
          // prefer explicit provider_account_id; fall back to metadata fields commonly used
          provider_account = provider_account || (upa as any).provider_account_id || (upa as any).metadata?.paypal_email || (upa as any).metadata?.email || (upa as any).metadata?.email_address || null;
        }
      }
    } catch (fillErr) {
      console.warn('Failed to lookup user_payment_accounts while approving withdrawal', fillErr);
    }

    // mark approved and persist any discovered provider/provider_account
    const { error: updErr } = await supabaseAdmin.from('withdrawals').update({ status: 'approved', approved_at: new Date().toISOString(), admin_id: user.id, provider: provider || null, provider_account: provider_account || null, updated_at: new Date().toISOString() }).eq('id', withdrawalId);
    if (updErr) throw updErr;

    // update local object so subsequent payout logic uses the persisted provider/account
    (w as any).provider = provider;
    (w as any).provider_account = provider_account;

    // insert audit log
    await supabaseAdmin.from('withdrawal_audit_logs').insert([{ withdrawal_id: withdrawalId, admin_id: user.id, action: 'approved', note: null }]);

    // attempt Stripe payout if configured and provider account exists
    if (stripe && w.provider === 'stripe' && w.provider_account) {
      try {
        // Create payout using Stripe Connect: transfer from platform to connected account then payout
        // Approach depends on your Stripe setup. Here we attempt a simple Transfer -> Payout flow
        const amountCents = Math.round(Number(w.amount) * 100);

        // Create a Payment to connected account (using destination charges or transfers) — simplified example:
        const transfer = await stripe.transfers.create({ amount: amountCents, currency: w.currency || 'eur', destination: w.provider_account });

        // Optionally create a payout on connected account (requires platform to have balance)
        // Note: many Connect setups auto-handle payouts; adjust to your account type.
        const payout = await stripe.payouts.create({ amount: amountCents, currency: w.currency || 'eur' }, { stripeAccount: w.provider_account });

        // ===== WEBHOOK-BASED STATUS =====
        // Mark as 'approved' with payout_id, let webhook update to 'paid' or 'payout_failed'
        // This ensures accurate tracking via Stripe's async payout processing
        await supabaseAdmin.from('withdrawals').update({ 
          status: 'approved',  // Webhook will update to 'paid' when complete
          provider: 'stripe', 
          provider_payout_id: payout.id, 
          provider_response: payout, 
          updated_at: new Date().toISOString() 
        }).eq('id', withdrawalId);
        
        await supabaseAdmin.from('withdrawal_audit_logs').insert([{ 
          withdrawal_id: withdrawalId, 
          admin_id: user.id, 
          action: 'payout_initiated', 
          data: payout 
        }]);
        
        console.log('✅ Stripe payout created:', payout.id, '- Status will be updated via webhook');
        return NextResponse.json({ 
          ok: true, 
          paid: false,  // Not yet paid, waiting for webhook
          processing: true,
          payout_id: payout.id,
          message: 'Payout initiated - webhook will confirm completion' 
        });
      } catch (stripeErr: any) {
        console.error('Stripe payout error', stripeErr);
        const code = stripeErr?.code || (stripeErr?.raw && stripeErr.raw.code) || null;
        const statusCode = stripeErr?.statusCode || null;

        // Prepare admin-friendly guidance for insufficient balance in test mode
        let adminMessage = stripeErr?.message || String(stripeErr);
        if (code === 'balance_insufficient') {
          adminMessage = 'Stripe reports insufficient available balance. In test mode you can add funds to the available balance using the test card 4000000000000077 (see https://stripe.com/docs/testing#available-balance).';
        }

        // Persist a provider_payouts row with failed status and specific code for later inspection/retry
        try {
          const errPayload = stripeErr && typeof stripeErr === 'object' ? stripeErr : { message: String(stripeErr) };
          await supabaseAdmin.from('provider_payouts').insert([{ withdrawal_id: withdrawalId, provider: 'stripe', provider_payout_id: null, amount: Number(w.amount || 0), currency: w.currency || 'EUR', status: code === 'balance_insufficient' ? 'failed_insufficient_funds' : 'failed', response: errPayload }]);
        } catch (ppErr) {
          console.warn('Failed to insert provider_payouts row for stripe error', ppErr);
        }

        // keep withdrawal as approved (money reserved) but record provider response
        await supabaseAdmin.from('withdrawals').update({ status: 'approved', provider_response: stripeErr, updated_at: new Date().toISOString() }).eq('id', withdrawalId);
        await supabaseAdmin.from('withdrawal_audit_logs').insert([{ withdrawal_id: withdrawalId, admin_id: user.id, action: 'payout_failed', data: stripeErr }]);

        // Return structured, actionable response to admin UI
        return NextResponse.json({ ok: true, paid: false, error: adminMessage, stripe_error: { code, statusCode, requestId: stripeErr?.requestId || stripeErr?.raw?.request_id || null, doc_url: stripeErr?.doc_url || (stripeErr?.raw && stripeErr.raw.doc_url) || null } });
      }
    }

    // attempt PayPal payout if configured and provider account exists
    if (PAYPAL_CLIENT_ID && PAYPAL_CLIENT_SECRET && w.provider === 'paypal' && w.provider_account) {
      try {
        // Get PayPal access token
        const auth = btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`);
        const tokenRes = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', { // Use api.paypal.com for production
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: 'grant_type=client_credentials'
        });
        if (!tokenRes.ok) throw new Error('Failed to get PayPal access token');
        const tokenData = await tokenRes.json();
        const accessToken = tokenData.access_token;

        // Create payout
        const payoutRes = await fetch('https://api-m.sandbox.paypal.com/v1/payments/payouts', { // Use api.paypal.com for production
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sender_batch_header: {
              sender_batch_id: `batch_${withdrawalId}`,
              email_subject: 'You have a payout!',
              email_message: 'You have received a payout from Kick Expert.'
            },
            items: [{
              recipient_type: 'EMAIL',
              amount: {
                value: w.amount.toString(),
                currency: w.currency || 'EUR'
              },
              receiver: w.provider_account,
              note: 'Withdrawal payout',
              sender_item_id: withdrawalId
            }]
          })
        });

        if (!payoutRes.ok) {
          const errData = await payoutRes.json();
          throw new Error(errData.message || 'PayPal payout failed');
        }

        const payoutData = await payoutRes.json();
        const payoutBatchId = payoutData.batch_header.payout_batch_id;

        // ===== WEBHOOK-BASED STATUS (PayPal) =====
        // Mark as 'approved' with batch_id, PayPal may send webhook updates
        await supabaseAdmin.from('withdrawals').update({ 
          status: 'approved',  // Can be updated via PayPal webhook if configured
          provider: 'paypal', 
          provider_payout_id: payoutBatchId, 
          provider_response: payoutData, 
          updated_at: new Date().toISOString() 
        }).eq('id', withdrawalId);
        
        await supabaseAdmin.from('withdrawal_audit_logs').insert([{ 
          withdrawal_id: withdrawalId, 
          admin_id: user.id, 
          action: 'payout_initiated', 
          data: payoutData 
        }]);
        
        console.log('✅ PayPal payout created:', payoutBatchId);
        return NextResponse.json({ 
          ok: true, 
          paid: false,  // Not yet confirmed, may update via webhook
          processing: true,
          payout_batch_id: payoutBatchId,
          message: 'PayPal payout initiated - may update via webhook' 
        });
      } catch (paypalErr: any) {
        console.error('PayPal payout error', paypalErr);
        // Persist a provider_payouts row with failed status for later inspection/retry
        try {
          const errPayload = paypalErr && typeof paypalErr === 'object' ? paypalErr : { message: String(paypalErr) };
          await supabaseAdmin.from('provider_payouts').insert([{ withdrawal_id: withdrawalId, provider: 'paypal', provider_payout_id: null, amount: Number(w.amount || 0), currency: w.currency || 'EUR', status: 'failed', response: errPayload }]);
        } catch (ppErr) {
          console.warn('Failed to insert provider_payouts row for paypal error', ppErr);
        }

        // keep withdrawal as approved but record provider response
        await supabaseAdmin.from('withdrawals').update({ status: 'approved', provider_response: paypalErr, updated_at: new Date().toISOString() }).eq('id', withdrawalId);
        await supabaseAdmin.from('withdrawal_audit_logs').insert([{ withdrawal_id: withdrawalId, admin_id: user.id, action: 'payout_failed', data: paypalErr }]);
        return NextResponse.json({ ok: true, paid: false, error: paypalErr?.message || String(paypalErr) });
      }
    }

    return NextResponse.json({ ok: true, paid: false, message: 'Approved — no payout provider configured for automatic payout' });
  } catch (err) {
    console.error('Error approving withdrawal', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
