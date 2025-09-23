import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;

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

    // mark approved
    const { error: updErr } = await supabaseAdmin.from('withdrawals').update({ status: 'approved', approved_at: new Date().toISOString(), admin_id: user.id, updated_at: new Date().toISOString() }).eq('id', withdrawalId);
    if (updErr) throw updErr;

    // insert audit log
    await supabaseAdmin.from('withdrawal_audit_logs').insert([{ withdrawal_id: withdrawalId, admin_id: user.id, action: 'approved', note: null }]);

    // attempt Stripe payout if configured and provider account exists
    if (stripe && w.provider_account) {
      try {
        // Create payout using Stripe Connect: transfer from platform to connected account then payout
        // Approach depends on your Stripe setup. Here we attempt a simple Transfer -> Payout flow
        const amountCents = Math.round(Number(w.amount) * 100);

        // Create a Payment to connected account (using destination charges or transfers) — simplified example:
        const transfer = await stripe.transfers.create({ amount: amountCents, currency: w.currency || 'usd', destination: w.provider_account });

        // Optionally create a payout on connected account (requires platform to have balance)
        // Note: many Connect setups auto-handle payouts; adjust to your account type.
        const payout = await stripe.payouts.create({ amount: amountCents, currency: w.currency || 'usd' }, { stripeAccount: w.provider_account });

        await supabaseAdmin.from('withdrawals').update({ status: 'paid', provider: 'stripe', provider_payout_id: payout.id, provider_response: payout, paid_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', withdrawalId);
        await supabaseAdmin.from('withdrawal_audit_logs').insert([{ withdrawal_id: withdrawalId, admin_id: user.id, action: 'payout_initiated', data: payout }]);
        return NextResponse.json({ ok: true, paid: true, payout_id: payout.id });
      } catch (stripeErr: any) {
        console.error('Stripe payout error', stripeErr);
        // mark as payout_failed but leave approved
        await supabaseAdmin.from('withdrawals').update({ status: 'approved', provider_response: stripeErr, updated_at: new Date().toISOString() }).eq('id', withdrawalId);
        await supabaseAdmin.from('withdrawal_audit_logs').insert([{ withdrawal_id: withdrawalId, admin_id: user.id, action: 'payout_failed', data: stripeErr }]);
        return NextResponse.json({ ok: true, paid: false, error: stripeErr?.message || String(stripeErr) });
      }
    }

    return NextResponse.json({ ok: true, paid: false, message: 'Approved — no payout provider configured for automatic payout' });
  } catch (err) {
    console.error('Error approving withdrawal', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
