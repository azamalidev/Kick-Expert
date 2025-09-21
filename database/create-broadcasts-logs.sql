-- Create broadcasts and audit tables; extend notifications for metrics

-- Broadcasts table stores broadcast messages and targeting/schedule
CREATE TABLE IF NOT EXISTS public.broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  type text NOT NULL,
  priority text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  cta_url text NULL,
  is_banner boolean DEFAULT false,
  expiry_date timestamptz DEFAULT (now() + '90 days'::interval),
  target jsonb DEFAULT '{}'::jsonb,
  schedule_at timestamptz NULL,
  status text DEFAULT 'scheduled', -- scheduled, sent, cancelled
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_broadcasts_schedule_at ON public.broadcasts (schedule_at);

-- Audit/log table for broadcast actions
CREATE TABLE IF NOT EXISTS public.broadcast_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id uuid REFERENCES public.broadcasts(id) ON DELETE CASCADE,
  action text NOT NULL,
  actor_id uuid NULL,
  meta jsonb NULL,
  created_at timestamptz DEFAULT now()
);

-- Extend notifications: add broadcast_id and metrics
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS broadcast_id uuid NULL;

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz NULL;

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS opened_at timestamptz NULL;

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS clicked_count integer DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_notifications_broadcast_id ON public.notifications (broadcast_id);
