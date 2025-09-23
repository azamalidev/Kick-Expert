import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

const supabaseAdmin = createClient(SUPABASE_URL || '', SERVICE_ROLE_KEY || '', { auth: { persistSession: false } });

const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2025-07-30.basil' }) : null;

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    let user: any = null;
    if (authHeader?.startsWith('Bearer ')) {
      const authToken = authHeader.split(' ')[1];
      const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(authToken as string);
      if (!userErr && userData?.user) user = userData.user;
    }

    const body = await req.json();
    const providerAccountId = body?.providerAccountId || body?.acct;
    if (!providerAccountId) return NextResponse.json({ error: 'providerAccountId required' }, { status: 400 });

    // Verify that this account belongs to the requesting user OR accept a valid one-time return token
    const { data: acct } = await supabaseAdmin.from('user_payment_accounts').select('*').eq('provider_account_id', providerAccountId).maybeSingle();
    if (!acct) return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    // normalize metadata: sometimes stored as JSON string in the DB
    const rawMetadata = acct.metadata;
    let metadataObj: any = {};
    let metadataWasString = false;
    try {
      if (typeof rawMetadata === 'string') {
        metadataWasString = true;
        metadataObj = JSON.parse(rawMetadata || '{}');
      } else if (rawMetadata) {
        metadataObj = rawMetadata;
      } else {
        metadataObj = {};
      }
    } catch (pErr) {
      metadataObj = {};
      metadataWasString = false;
    }

    // check token if no user session
    const providedToken = body?.token || new URL(req.url).searchParams.get('token');
    if (!user) {
      if (!providedToken) return NextResponse.json({ error: 'Unauthorized: no session or token' }, { status: 401 });
      const storedToken = metadataObj?.return_token;
      const expiry = metadataObj?.return_token_expires_at;
      if (!storedToken || storedToken !== providedToken) return NextResponse.json({ error: 'Invalid token' }, { status: 403 });
      if (expiry && new Date(expiry) < new Date()) return NextResponse.json({ error: 'Token expired' }, { status: 403 });
      // token valid; we'll allow verification
    } else {
      if (acct.user_id !== user.id) return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
    }

    // If we have a Stripe key, fetch the account to determine real verification status
    let newStatus = 'verified';
    let metadata: any = acct?.metadata || {};

    if (stripe) {
      try {
        const stripeAcct: any = await stripe.accounts.retrieve(providerAccountId);
        metadata = stripeAcct || metadata;

        const currentlyDue = stripeAcct.requirements?.currently_due || [];
        const detailsSubmitted = !!stripeAcct.details_submitted;
        const payoutsEnabled = !!stripeAcct.payouts_enabled;

        if (detailsSubmitted && currentlyDue.length === 0 && payoutsEnabled) {
          newStatus = 'verified';
        } else if (detailsSubmitted) {
          newStatus = 'pending';
        } else {
          newStatus = 'unverified';
        }
      } catch (sErr) {
        console.warn('Failed to retrieve stripe account for verification', sErr);
        // fallback to marking verified (previous behavior)
        newStatus = 'verified';
      }
    } else {
      // No Stripe secret configured; follow user's request and mark verified locally
      newStatus = 'verified';
    }

  // clear return token after use
  const clearedMetadata = { ...metadataObj };
  if (clearedMetadata?.return_token) delete clearedMetadata.return_token;
  if (clearedMetadata?.return_token_expires_at) delete clearedMetadata.return_token_expires_at;

  const metadataToSave = metadataWasString ? JSON.stringify(clearedMetadata) : clearedMetadata;
  await supabaseAdmin.from('user_payment_accounts').update({ kyc_status: newStatus, metadata: metadataToSave, updated_at: new Date().toISOString() }).eq('provider_account_id', providerAccountId);

    return NextResponse.json({ ok: true, kyc_status: newStatus });
  } catch (err: any) {
    console.error('mark-verified error', err);
    return NextResponse.json({ error: err?.message || 'Failed' }, { status: 500 });
  }
}
