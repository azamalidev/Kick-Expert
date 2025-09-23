import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const stripe = STRIPE_SECRET ? new Stripe(STRIPE_SECRET, { apiVersion: '2025-07-30.basil' }) : null;
const supabaseAdmin = createClient(SUPABASE_URL || '', SERVICE_ROLE_KEY || '', { auth: { persistSession: false } });

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const token = authHeader.split(' ')[1];

    const { data: { user }, error: userErr } = await supabaseAdmin.auth.getUser(token as string);
    if (userErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Get user's payment account
    const { data: acct, error: acctErr } = await supabaseAdmin.from('user_payment_accounts').select('*').eq('user_id', user.id).maybeSingle();
    if (acctErr) throw acctErr;
    if (!acct || !acct.provider_account_id) return NextResponse.json({ exists: false, message: 'No connected account found' }, { status: 404 });

    if (!stripe) return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });

    const account = await stripe.accounts.retrieve(acct.provider_account_id);

    const detailsSubmitted = Boolean((account as any).details_submitted);
    const currentlyDue = ((account as any).requirements?.currently_due || []).length;
    const payoutsEnabled = Boolean((account as any).payouts_enabled);

    let kycStatus = 'unverified';
    if (detailsSubmitted && currentlyDue === 0 && payoutsEnabled) kycStatus = 'verified';
    else if (detailsSubmitted) kycStatus = 'pending';

    const { error: updErr } = await supabaseAdmin.from('user_payment_accounts').update({ kyc_status: kycStatus, metadata: account, updated_at: new Date().toISOString() }).eq('provider_account_id', acct.provider_account_id);
    if (updErr) throw updErr;

    return NextResponse.json({ ok: true, kyc_status: kycStatus, account });
  } catch (err: any) {
    console.error('Refresh stripe account error', err);
    return NextResponse.json({ error: err?.message || 'Internal' }, { status: 500 });
  }
}
