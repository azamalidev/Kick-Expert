import type { NextApiRequest, NextApiResponse } from 'next';
import { sendEmail } from '@/lib/email';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  const { to, campaignName, htmlContent } = req.body;

  const unsubscribeLink = `${process.env.APP_URL}/unsubscribe?email=${encodeURIComponent(to)}`;

  const finalHtml = `
    ${htmlContent}
    <p style="font-size:12px;color:#888;margin-top:20px;">
      You’re receiving this because you opted in to KickExpert promotional emails. 
      <a href="${unsubscribeLink}">Unsubscribe</a> anytime.
    </p>
  `;

  try {
    await sendEmail({
      to,
      subject: `[Promo] ${campaignName}`,
      html: finalHtml,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, error });
  }
}
