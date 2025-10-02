import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase server env variables');
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { token } = req.query;
  if (!token || typeof token !== 'string') return res.status(400).send('Invalid token');

  try {
    const { data: row } = await supabaseAdmin.from('email_verifications').select('id,user_id,used').eq('token', token).limit(1).maybeSingle();
    if (!row) return res.status(404).send('Token not found');
    if ((row as any).used) return res.status(200).send('Already confirmed');

    const userId = (row as any).user_id;

    // mark user as confirmed in auth.users via admin SDK
    const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(userId, { email_confirm: true });
    if (confirmError) {
      console.error('Failed to confirm email via SDK:', confirmError);
      throw new Error(`Email confirmation failed: ${confirmError.message}`);
    } else {
      console.log('Email confirmed successfully via SDK');
    }

    // mark verification token used and update users/profiles table flag if present
    await supabaseAdmin.from('email_verifications').update({ used: true }).eq('id', (row as any).id);
    await supabaseAdmin.from('users').update({ email_confirmed: true }).eq('id', userId);

    // Try to fetch the user's email for a smoother redirect (prefill login if needed)
    const { data: userRow } = await supabaseAdmin.from('users').select('email').eq('id', userId).limit(1).maybeSingle();
    const userEmail = (userRow as any)?.email || null;

  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  // Redirect to /auth/callback so the client-side callback can attempt to parse a session.
  // Include verified flag and email (if found) so the callback can forward to login with an email prefill when no session exists.
  const redirectUrl = `${base.replace(/\/$/, '')}/auth/callback?verified=1${userEmail ? `&email=${encodeURIComponent(userEmail)}` : ''}`;
  return res.redirect(302, redirectUrl);
  } catch (error) {
    console.error('verify error', error);
    return res.status(500).send('Server error');
  }
}
