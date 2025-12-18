import type { NextApiRequest, NextApiResponse } from 'next';
import { emailQueue } from '@/lib/queue';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405);

  if (!emailQueue) {
    return res.status(200).json({
      error: 'Email queue not configured',
      message: 'REDIS_URL environment variable is not set properly',
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
    });
  }

  try {
    const waiting = await emailQueue.getWaiting();
    const active = await emailQueue.getActive();
    const completed = await emailQueue.getCompleted();
    const failed = await emailQueue.getFailed();

    return res.status(200).json({
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      jobs: {
        waiting: waiting.map((j: any) => ({ id: j.id, data: j.data })),
        active: active.map((j: any) => ({ id: j.id, data: j.data })),
        failed: failed.map((j: any) => ({ id: j.id, data: j.data, failedReason: j.failedReason })),
      },
    });
  } catch (error) {
    console.error('Jobs status error', error);
    return res.status(500).json({ error: 'Failed to get job status' });
  }
}