import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
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

  const { type, userId, data } = req.body;

  // Basic protection: require a server-to-server token header (simple) or restrict via server-side only calls.
  // Set environment variable INTERNAL_API_KEY to a strong secret and use it when calling this route from server code.
  const internalKey = req.headers['x-internal-key'];
  if (!internalKey || internalKey !== process.env.INTERNAL_API_KEY) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    // Resolve recipient server-side. If userId provided, fetch their email from auth.users
    let recipientEmail = '';
    let recipientName: string | undefined;

    if (userId) {
      const { data: userRow } = await supabaseAdmin.from('profiles').select('user_id, username').eq('user_id', userId).limit(1).single();
      if (userRow && (userRow as any).username) recipientName = (userRow as any).username;

      // Use Supabase Admin API to get the user's email
      try {
        // @ts-ignore - admin API
        const { data: adminUser } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (adminUser && (adminUser as any).email) recipientEmail = (adminUser as any).email;
      } catch (err) {
        // fallback: try selecting from auth.users
        try {
          const { data: authUser } = await supabaseAdmin.from('auth.users').select('email').eq('id', userId).limit(1).single();
          if (authUser && (authUser as any).email) recipientEmail = (authUser as any).email;
        } catch (e) {
          // ignore
        }
      }
    }

    // If the recipientEmail still empty and a data.email is provided internally, use it (but not from clients)
    if (!recipientEmail && data?.email) recipientEmail = data.email;

    if (!recipientEmail) return res.status(400).json({ message: 'Recipient not found' });

    let subject = '';
    let html = '';

    if (type === 'signupVerification') {
      const verifyLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/verify?token=${data?.token}`;
      const tpl = transactionalTemplates.signupVerification(verifyLink, recipientName);
      subject = tpl.subject; html = tpl.html;
    }

    if (type === 'passwordReset') {
      const resetLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset-password?token=${data?.token}`;
      const tpl = transactionalTemplates.passwordReset(resetLink);
      subject = tpl.subject; html = tpl.html;
    }

    // Send via SendGrid if configured, otherwise fallback to existing Brevo wrapper
    if (process.env.SENDGRID_API_KEY) {
      await sendGridEmail({ to: recipientEmail, subject, html });
    } else {
      await brevoSendEmail({ to: recipientEmail, subject, html });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('email/send error', error);
    return res.status(500).json({ success: false, error: String(error) });
  }
}
