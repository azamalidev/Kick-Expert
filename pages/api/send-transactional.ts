import type { NextApiRequest, NextApiResponse } from 'next';
import { sendEmail } from '@/lib/email';
import { transactionalTemplates } from '@/emails/transactionalTemplates';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  const { type, to, data } = req.body;
  // type = 'signupVerification' | 'passwordReset'

  try {
    let subject = '';
    let html = '';

    if (type === 'signupVerification') {
      subject = 'Verify your email';
      html = transactionalTemplates.signupVerification(data.verifyLink);
    }

    if (type === 'passwordReset') {
      subject = 'Reset your password';
      html = transactionalTemplates.passwordReset(data.resetLink);
    }

    if (type === 'test') {
      subject = 'test  email';
      html = transactionalTemplates.testCheck();
    }

    console.log(html, "htmlhtmlhtml-----------htmlhtmlhtml")

    await sendEmail({ to, subject, html });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.log(error, "error")
    return res.status(500).json({ success: false, error });
  }
}
