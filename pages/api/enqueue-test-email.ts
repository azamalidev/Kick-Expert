import type { NextApiRequest, NextApiResponse } from 'next';
import { enqueueEmail } from '@/lib/queue';

const testTemplate = { subject: 'Test Reminder', html: 'Hi {{name}}, this is a test email.' };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405);

  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });

  try {
    await enqueueEmail(userId, 'transactional', testTemplate, { name: 'Test User' });
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Enqueue error', error);
    return res.status(500);
  }
}