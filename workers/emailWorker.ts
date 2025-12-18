// workers/emailWorker.ts
// Dedicated worker script for processing email jobs

import { emailWorker } from '../lib/queue';

if (emailWorker) {
  console.log('✓ Email worker started and listening for jobs...');
} else {
  console.warn('⚠️  Email worker could not start - Redis not configured');
  console.warn('   Please set REDIS_URL in your .env.local file');
  process.exit(1);
}

// The worker is already instantiated in lib/queue.ts
// This file ensures it's loaded when running the worker

process.on('SIGTERM', async () => {
  console.log('Shutting down email worker');
  if (emailWorker) {
    await emailWorker.close();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Shutting down email worker');
  if (emailWorker) {
    await emailWorker.close();
  }
  process.exit(0);
});