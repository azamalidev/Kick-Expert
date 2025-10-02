#!/usr/bin/env node

// Script to sync SendGrid suppression lists with DB
// Run periodically, e.g., via cron

const fetch = require('node-fetch');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BREVO_API_KEY = process.env.BREVO_API_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !BREVO_API_KEY) {
  console.error('Missing env vars');
  process.exit(1);
}

async function syncSuppression() {
  try {
    // Fetch unsubscribed contacts from Brevo
    const unsubRes = await fetch('https://api.brevo.com/v3/contacts?filter[unsubscribed]=true', {
      headers: { 'api-key': BREVO_API_KEY },
    });
    const unsubData = await unsubRes.json();
    const unsubEmails = (unsubData.contacts || []).map(c => c.email);

    // Fetch bounced contacts (Brevo has hard bounces)
    // Brevo doesn't have direct bounce list, but can check contacts with attributes
    // For simplicity, only handle unsubscribes
    const emails = new Set(unsubEmails);

    // Update DB
    const now = new Date().toISOString();
    for (const email of emails) {
      // Update newsletter_subscribers
      await fetch(`${SUPABASE_URL}/rest/v1/newsletter_subscribers?email=eq.${encodeURIComponent(email)}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'apikey': SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ unsubscribed_at: now, updated_at: now }),
      });

      // Update email_consents
      await fetch(`${SUPABASE_URL}/rest/v1/email_consents?email=eq.${encodeURIComponent(email)}&consent_type=eq.marketing`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'apikey': SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ revoked_at: now, unsubscribe_date: now }),
      });
    }

    console.log('Synced suppression for', emails.size, 'emails');
  } catch (err) {
    console.error('Sync error', err);
  }
}

syncSuppression();