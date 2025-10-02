-- 20251001_create_newsletter_tables.sql
-- Creates newsletter_subscribers, email_consents, and email_events_audit tables

BEGIN;

-- newsletter_subscribers: holds confirmed subscriptions
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text NOT NULL UNIQUE,
  name text,
  confirmed boolean DEFAULT false NOT NULL,
  confirm_token text,
  confirm_sent_at timestamptz,
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  source text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- email_consents: link to user_id if known
CREATE TABLE IF NOT EXISTS public.email_consents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text NOT NULL,
  ip_address text,
  consent_type text NOT NULL, -- e.g. 'marketing', 'transactional'
  granted boolean DEFAULT true,
  granted_at timestamptz DEFAULT now(),
  revoked_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- email_events_audit: records sends, opens, clicks, bounces etc.
CREATE TABLE IF NOT EXISTS public.email_events_audit (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text NOT NULL,
  event_type text NOT NULL,
  provider text DEFAULT 'brevo',
  provider_event_id text,
  payload jsonb,
  created_at timestamptz DEFAULT now()
);

-- email_suppression: tracks suppressed emails for compliance
CREATE TABLE IF NOT EXISTS public.email_suppression (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text NOT NULL UNIQUE,
  reason text NOT NULL, -- 'bounce', 'spam', 'unsubscribe'
  suppressed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

COMMIT;
