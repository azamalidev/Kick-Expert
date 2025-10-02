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
      const template = transactionalTemplates.signupVerification(data.verifyLink);
      subject = template.subject;
      html = template.html;
    }

    if (type === 'passwordReset') {
      const template = transactionalTemplates.passwordReset(data.resetLink);
      subject = template.subject;
      html = template.html;
    }

    if (type === 'test') {
      const template = transactionalTemplates.testCheck();
      subject = template.subject;
      html = template.html;
    }

    console.log(html, "htmlhtmlhtml-----------htmlhtmlhtml")

    await sendEmail({ to, subject, html });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.log(error, "error")
    return res.status(500).json({ success: false, error });
  }
}
