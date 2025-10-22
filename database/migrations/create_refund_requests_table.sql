-- Create refund_requests table
CREATE TABLE IF NOT EXISTS public.refund_requests (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'::text,
  reason TEXT NOT NULL,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT refund_requests_pkey PRIMARY KEY (id),
  CONSTRAINT refund_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_refund_requests_user_id 
  ON public.refund_requests USING btree (user_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_refund_requests_status 
  ON public.refund_requests USING btree (status) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_refund_requests_created_at 
  ON public.refund_requests USING btree (created_at) TABLESPACE pg_default;

-- Create trigger to update the updated_at column
CREATE OR REPLACE TRIGGER update_refund_requests_updated_at
BEFORE UPDATE ON refund_requests
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own refund requests
CREATE POLICY "Users can view their own refund requests"
  ON public.refund_requests
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own refund requests
CREATE POLICY "Users can create their own refund requests"
  ON public.refund_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all refund requests
CREATE POLICY "Admins can view all refund requests"
  ON public.refund_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Admins can update refund requests
CREATE POLICY "Admins can update refund requests"
  ON public.refund_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );
