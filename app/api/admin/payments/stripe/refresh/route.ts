import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) console.warn('Supabase admin payments refresh not configured');
if (!STRIPE_SECRET) console.warn('Stripe secret not configured for admin refresh');

const supabaseAdmin = createClient(SUPABASE_URL || '', SERVICE_ROLE_KEY || '', { auth: { persistSession: false } });
const stripe = STRIPE_SECRET ? new Stripe(STRIPE_SECRET, { apiVersion: '2025-07-30.basil' }) : null;

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

    const body = await req.json();
    const providerAccountId = body?.provider_account_id || body?.provider_account || null;
    if (!providerAccountId) return NextResponse.json({ error: 'Missing provider_account_id' }, { status: 400 });

    if (!stripe) return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });

    // retrieve Stripe account
    const account = await stripe.accounts.retrieve(providerAccountId);
    const detailsSubmitted = Boolean((account as any).details_submitted);
    const currentlyDue = ((account as any).requirements?.currently_due || []).length;
    const payoutsEnabled = Boolean((account as any).payouts_enabled);

    let kycStatus = 'unverified';
    if (detailsSubmitted && currentlyDue === 0 && payoutsEnabled) kycStatus = 'verified';
    else if (detailsSubmitted) kycStatus = 'pending';

    // update matching user_payment_accounts row
    const { error: updErr } = await supabaseAdmin.from('user_payment_accounts').update({ kyc_status: kycStatus, metadata: account, updated_at: new Date().toISOString() }).eq('provider_account_id', providerAccountId);
    if (updErr) console.warn('Failed to update user_payment_accounts during admin refresh', updErr);

    return NextResponse.json({ ok: true, kyc_status: kycStatus, account });
  } catch (err: any) {
    console.error('Admin refresh stripe account error', err);
    return NextResponse.json({ error: err?.message || 'Internal' }, { status: 500 });
  }
}
