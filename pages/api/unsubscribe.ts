import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { email } = req.query;

  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    // TODO: Update DB to mark unsubscribed + optionally call Brawo suppression API
    console.log(`Unsubscribed: ${email}`);

    return res.status(200).json({ success: true, message: 'Unsubscribed successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, error });
  }
}
