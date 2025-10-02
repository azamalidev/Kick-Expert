import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

export async function processWebhookEvent(event: any) {
  const { email, event: eventType, id: providerEventId, ...rest } = event;
  if (!email || !eventType) return;

  const now = new Date().toISOString();

  // Get IP from consents if available
  const { data: consent } = await supabaseAdmin
    .from('email_consents')
    .select('ip_address')
    .eq('email', email)
    .eq('consent_type', 'marketing')
    .single();

  // Insert audit log
  await supabaseAdmin.from('email_events_audit').insert({
    email,
    event_type: eventType,
    provider: 'brevo',
    provider_event_id: providerEventId,
    payload: rest,
    ip_address: consent?.ip_address || null,
  });

  if (eventType === 'unsubscribe' || eventType === 'unsubscribed') {
    // Update newsletter_subscribers
    await supabaseAdmin
      .from('newsletter_subscribers')
      .update({ unsubscribed_at: now, updated_at: now })
      .eq('email', email);

    // Update email_consents
    await supabaseAdmin
      .from('email_consents')
      .update({ revoked_at: now, unsubscribe_date: now })
      .eq('email', email)
      .eq('consent_type', 'marketing');

    // Update users email_opt_in
    await supabaseAdmin
      .from('users')
      .update({ email_opt_in: false, updated_at: now })
      .eq('email', email);

    console.log('Unsubscribed:', email);
  } else if (eventType === 'hardBounce' || eventType === 'softBounce' || eventType === 'bounce') {
    // Add to suppression
    await supabaseAdmin.from('email_suppression').upsert({
      email,
      reason: 'bounce',
      suppressed_at: now,
    }, { onConflict: 'email' });

    // Check bounce rate (simple alert)
    const { count: bounceCount } = await supabaseAdmin
      .from('email_events_audit')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'bounce')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const { count: totalSent } = await supabaseAdmin
      .from('email_events_audit')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'delivered')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const bounceRate = (totalSent || 0) > 0 ? ((bounceCount || 0) / (totalSent || 0)) * 100 : 0;
    if (bounceRate > 2) {
      console.warn(`ALERT: Bounce rate is ${bounceRate.toFixed(2)}% > 2%`);
    }

    console.log('Bounced:', email);
  } else if (eventType === 'spam' || eventType === 'spamreport') {
    // Add to suppression
    await supabaseAdmin.from('email_suppression').upsert({
      email,
      reason: 'spam',
      suppressed_at: now,
    }, { onConflict: 'email' });

    // Check complaint rate
    const { count: complaintCount } = await supabaseAdmin
      .from('email_events_audit')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'spam')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const { count: totalSent } = await supabaseAdmin
      .from('email_events_audit')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'delivered')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const complaintRate = (totalSent || 0) > 0 ? ((complaintCount || 0) / (totalSent || 0)) * 100 : 0;
    if (complaintRate > 0.1) {
      console.warn(`ALERT: Complaint rate is ${complaintRate.toFixed(2)}% > 0.1%`);
    }

    console.log('Spam reported:', email);
  } else if (eventType === 'delivered' || eventType === 'opened' || eventType === 'clicked') {
    // Just audit, no DB update needed
    console.log(`${eventType}:`, email);
  }
  // Handle other events if needed
}