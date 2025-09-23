import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2025-07-30.basil' });
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(SUPABASE_URL || '', SERVICE_ROLE_KEY || '', { auth: { persistSession: false } });

export async function POST(req: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });

    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const token = authHeader.split(' ')[1];

    const { data: { user }, error: userErr } = await supabaseAdmin.auth.getUser(token as string);
    if (userErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Check for existing payment account
    const { data: existing } = await supabaseAdmin.from('user_payment_accounts').select('*').eq('user_id', user.id).maybeSingle();

    let accountId = existing?.provider_account_id;
    if (!accountId) {
      // Create Stripe connected account (Express)
      const acct = await stripe.accounts.create({ type: 'express', email: user.email });
      accountId = acct.id;

      // Save to DB
      await supabaseAdmin.from('user_payment_accounts').insert([{ user_id: user.id, provider: 'stripe', provider_account_id: accountId, kyc_status: 'unverified', metadata: acct }]);
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  // generate a one-time return token valid for 15 minutes
  const returnToken = crypto.randomBytes(20).toString('hex');
  const tokenExpiry = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    // Create account link for onboarding with the token appended to return_url
    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${siteUrl}/complete-profile`,
      // send the user to a dedicated success page so we can mark them verified when they return
  return_url: `${siteUrl}/payments/stripe/success?acct=${accountId}&token=${returnToken}`,
      type: 'account_onboarding'
    });

    // Store onboarding url (short-lived) and token in DB metadata
  // preserve metadata type: if metadata was stored as a JSON string, keep it stringified
  let metadataToSave: any = { return_token: returnToken, return_token_expires_at: tokenExpiry };
  if (existing?.metadata) {
    if (typeof existing.metadata === 'string') {
      try {
        const parsed = JSON.parse(existing.metadata || '{}');
        metadataToSave = { ...parsed, return_token: returnToken, return_token_expires_at: tokenExpiry };
        metadataToSave = JSON.stringify(metadataToSave);
      } catch (e) {
        // fallback: store as string map
        metadataToSave = JSON.stringify({ return_token: returnToken, return_token_expires_at: tokenExpiry });
      }
    } else {
      metadataToSave = { ...(existing.metadata as any), return_token: returnToken, return_token_expires_at: tokenExpiry };
    }
  }

  await supabaseAdmin.from('user_payment_accounts').update({ onboarding_url: link.url, metadata: metadataToSave }).eq('provider_account_id', accountId);

    const constructedReturnUrl = `${siteUrl}/payments/stripe/success?acct=${accountId}&token=${returnToken}`;
    return NextResponse.json({ url: link.url, return_url: constructedReturnUrl, return_token: returnToken });
  } catch (err: any) {
    console.error('Stripe onboard error', err);
    return NextResponse.json({ error: err?.message || 'Failed to create onboarding link' }, { status: 500 });
  }
}
