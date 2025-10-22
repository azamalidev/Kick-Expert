-- ============================================
-- CREATE CONTACTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.contacts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  topic text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  priority text NOT NULL DEFAULT 'medium',
  assigned_to uuid NULL,
  response text NULL,
  responded_at timestamp with time zone NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT contacts_pkey PRIMARY KEY (id),
  CONSTRAINT contacts_status_check CHECK (
    status = ANY (ARRAY['new'::text, 'open'::text, 'in_progress'::text, 'resolved'::text, 'closed'::text])
  ),
  CONSTRAINT contacts_priority_check CHECK (
    priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text])
  )
) TABLESPACE pg_default;

-- Enable RLS
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can insert contacts" ON public.contacts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own contacts" ON public.contacts
  FOR SELECT USING (auth.uid()::text = email OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can view all contacts" ON public.contacts
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update contacts" ON public.contacts
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_contacts_status ON public.contacts USING btree (status);
CREATE INDEX IF NOT EXISTS idx_contacts_priority ON public.contacts USING btree (priority);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON public.contacts USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON public.contacts USING btree (email);
CREATE INDEX IF NOT EXISTS idx_contacts_assigned_to ON public.contacts USING btree (assigned_to);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_contacts_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_contacts_timestamp ON public.contacts;
CREATE TRIGGER trg_update_contacts_timestamp
BEFORE UPDATE ON public.contacts
FOR EACH ROW
EXECUTE FUNCTION update_contacts_timestamp();
