import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { newsletterTemplates } from '@/emails/newsletterTemplates';
import { sendEmail } from '@/lib/email';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase server env variables');
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  const { email, name, source } = req.body;
  if (!email || typeof email !== 'string') return res.status(400).json({ message: 'Invalid email' });

  try {
    // create or update subscriber with a new confirm token
  const token = uuidv4();
  // Build a safe base URL for the confirmation link: prefer env, then request headers, then localhost
  const headerHost = req.headers.host;
  const headerProto = (req.headers['x-forwarded-proto'] as string) || 'http';
  const baseFromReq = headerHost ? `${headerProto}://${headerHost}` : undefined;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_URL || baseFromReq || 'http://localhost:3000';
  const confirmUrl = `${baseUrl.replace(/\/$/, '')}/api/newsletter/confirm?token=${token}`;

    const { error: upsertError } = await supabaseAdmin
      .from('newsletter_subscribers')
      .upsert(
        {
          email: email.toLowerCase(),
          name: name || null,
          confirm_token: token,
          confirm_sent_at: new Date().toISOString(),
          confirmed: false,
          source: source || 'website',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'email' }
      );

    if (upsertError) throw upsertError;

    // record a consent row for marketing
    await supabaseAdmin.from('email_consents').insert({ email: email.toLowerCase(), consent_type: 'marketing', granted: true }).select();

    // send confirmation email
    const tpl = newsletterTemplates.confirm(confirmUrl, name);
    await sendEmail({ to: email, subject: tpl.subject, html: tpl.html });

    return res.status(200).json({ success: true, message: 'Confirmation email sent' });
  } catch (error) {
    console.error('Subscribe error', error);
    return res.status(500).json({ success: false, error: String(error) });
  }
}
