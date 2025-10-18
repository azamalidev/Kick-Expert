import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { transactionalTemplates } from '@/emails/transactionalTemplates';
import sendGridEmail from '@/lib/sendgrid';
import { sendEmail as brevoSendEmail } from '@/lib/email';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase server env variables');
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });
  const { email, name } = req.body;
  if (!email) return res.status(400).json({ message: 'Email required' });

  try {
    // find user
    const { data: userRow } = await supabaseAdmin.from('users').select('id,email_confirmed').eq('email', email).limit(1).maybeSingle();
    if (!userRow) return res.status(200).json({ success: true });

    // create new token and send verification
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();
    await supabaseAdmin.from('email_verifications').insert([{ user_id: (userRow as any).id, token, expires_at: expiresAt }]);

  const base = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://www.kickexpert.com';
  const verifyLink = `${base.replace(/\/$/, '')}/api/auth/verify?token=${token}`;
    const tpl = transactionalTemplates.signupVerification(verifyLink, name || null);

    if (process.env.SENDGRID_API_KEY) {
      await sendGridEmail({ to: email, subject: tpl.subject, html: tpl.html });
    } else {
      await brevoSendEmail({ to: email, subject: tpl.subject, html: tpl.html });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('resend error', error);
    return res.status(500).json({ success: false, error: String(error) });
  }
}
