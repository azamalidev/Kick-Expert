import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { addContactToList } from '@/lib/email';

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
    const { data, error } = await supabaseAdmin
      .from('newsletter_subscribers')
      .select('id,email,name,confirmed')
      .eq('confirm_token', token)
      .limit(1)
      .single();

    if (error) return res.status(404).send('Token not found');

    if (data.confirmed) return res.status(200).send('Already confirmed');

    const now = new Date().toISOString();
    const { error: updateError } = await supabaseAdmin
      .from('newsletter_subscribers')
      .update({ confirmed: true, confirmed_at: now, confirm_token: null, updated_at: now })
      .eq('id', data.id);

    if (updateError) throw updateError;

    // insert consent row
    await supabaseAdmin.from('email_consents').insert({ email: data.email, consent_type: 'marketing', granted: true }).select();

    // add to SendGrid list
    await addContactToList(data.email, data.name);

  // Build safe base url
  const headerHost = req.headers.host;
  const headerProto = (req.headers['x-forwarded-proto'] as string) || 'http';
  const baseFromReq = headerHost ? `${headerProto}://${headerHost}` : undefined;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_URL || baseFromReq || 'http://localhost:3000';

  // optionally send a confirmed/thank-you email via background job; we'll send directly for now
  await fetch(`${baseUrl.replace(/\/$/, '')}/api/newsletter/send-confirmed`, { method: 'POST', body: JSON.stringify({ email: data.email, name: data.name }), headers: { 'Content-Type': 'application/json' } });

  // redirect to a friendly confirm page
  return res.redirect(302, `${baseUrl.replace(/\/$/, '')}/newsletter/confirmed`);
  } catch (error) {
    console.error('Confirm error', error);
    return res.status(500).send('Server error');
  }
}
