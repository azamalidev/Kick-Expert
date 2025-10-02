// workers/emailWorker.ts
// Dedicated worker script for processing email jobs

import { emailWorker } from '../lib/queue';

console.log('Email worker started and listening for jobs...');

// The worker is already instantiated in lib/queue.ts
// This file ensures it's loaded when running the worker

process.on('SIGTERM', async () => {
  console.log('Shutting down email worker');
  await emailWorker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Shutting down email worker');
  await emailWorker.close();
  process.exit(0);
});