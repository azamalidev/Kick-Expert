// Run this script to start the email worker
// node scripts/run-worker.js

require('dotenv').config({ path: '.env.local' });
require('tsx/cjs');
require('../workers/emailWorker.ts');