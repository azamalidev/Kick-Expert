import type { NextApiRequest, NextApiResponse } from 'next';
import { processWebhookEvent } from '@/lib/webhookProcessor';

const BREVO_WEBHOOK_TOKEN = process.env.BREVO_WEBHOOK_TOKEN;

if (!BREVO_WEBHOOK_TOKEN) {
  throw new Error('Missing BREVO_WEBHOOK_TOKEN environment variable');
}

function verifyWebhookToken(token: string): boolean {
  return token === BREVO_WEBHOOK_TOKEN;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  try {
    // Verify webhook token
    const token = req.headers['x-token'] as string || req.headers['authorization'] as string;
    if (!token || !verifyWebhookToken(token.replace('Bearer ', ''))) {
      console.error('Invalid webhook token');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const events = req.body; // array of events
    if (!Array.isArray(events)) return res.status(400).json({ error: 'Invalid payload' });

    for (const event of events) {
      await processWebhookEvent(event);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Brevo webhook error', error);
    return res.status(500).json({ error: 'Server error' });
  }
}