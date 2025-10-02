import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import sendGridEmail from '@/lib/sendgrid';
import { sendEmail as brevoSendEmail } from '@/lib/email';
import { transactionalTemplates } from '@/emails/transactionalTemplates';
import { v4 as uuidv4 } from 'uuid';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase server env variables');
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email required' });

  try {
    // Find user in your users table (server-side)
    const { data: userRow } = await supabaseAdmin.from('users').select('id,email').eq('email', email).limit(1).maybeSingle();

    // Always return 200 to avoid leaking whether an email exists
    if (!userRow) return res.status(200).json({ success: true });

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60).toISOString(); // 1 hour

    // Insert token into password_resets table
    await supabaseAdmin.from('password_resets').insert([
      { user_id: (userRow as any).id, token, expires_at: expiresAt, used: false }
    ]);

    const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const resetLink = `${base}/change-password?token=${token}`;

    const tpl = transactionalTemplates.passwordReset(resetLink);

    // Send via SendGrid if configured otherwise Brevo
    if (process.env.SENDGRID_API_KEY) {
      await sendGridEmail({ to: email, subject: tpl.subject, html: tpl.html });
    } else {
      await brevoSendEmail({ to: email, subject: tpl.subject, html: tpl.html });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('password/request error', error);
    return res.status(500).json({ success: false, error: String(error) });
  }
}
