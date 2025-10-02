import type { NextApiRequest, NextApiResponse } from 'next';
import { sendEmail } from '@/lib/email';
import { newsletterTemplates } from '@/emails/newsletterTemplates';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  const { email, name } = req.body;
  if (!email) return res.status(400).json({ message: 'Missing email' });

  try {
    const tpl = newsletterTemplates.confirmed(name);
    await sendEmail({ to: email, subject: tpl.subject, html: tpl.html });
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Send confirmed error', error);
    return res.status(500).json({ success: false, error: String(error) });
  }
}
