-- Step 3: Competition Cheat Actions Table
-- Central log for all cheating flags, traps, and admin reviews

-- Create table if not exists
CREATE TABLE IF NOT EXISTS public.competition_cheat_actions (
  id BIGSERIAL PRIMARY KEY,
  competition_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('flag', 'block', 'ban')),
  reason TEXT,
  created_by UUID REFERENCES auth.users(id), -- Admin who took/updated the action
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_cheat_actions_competition ON public.competition_cheat_actions(competition_id);
CREATE INDEX IF NOT EXISTS idx_cheat_actions_user ON public.competition_cheat_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_cheat_actions_type ON public.competition_cheat_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_cheat_actions_created_at ON public.competition_cheat_actions(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_cheat_action_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_cheat_action_updated_at ON public.competition_cheat_actions;
CREATE TRIGGER update_cheat_action_updated_at
BEFORE UPDATE ON public.competition_cheat_actions
FOR EACH ROW
EXECUTE FUNCTION update_cheat_action_timestamp();

-- Enable Row Level Security
ALTER TABLE public.competition_cheat_actions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow service role full access" ON public.competition_cheat_actions;
DROP POLICY IF EXISTS "Users can view their own cheat actions" ON public.competition_cheat_actions;
DROP POLICY IF EXISTS "Admins can view all cheat actions" ON public.competition_cheat_actions;
DROP POLICY IF EXISTS "Admins can insert cheat actions" ON public.competition_cheat_actions;
DROP POLICY IF EXISTS "Admins can update cheat actions" ON public.competition_cheat_actions;
DROP POLICY IF EXISTS "System can insert cheat actions" ON public.competition_cheat_actions;

-- Policy: Service role has full access (for system automated logging)
CREATE POLICY "Allow service role full access" ON public.competition_cheat_actions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Policy: Users can view their own cheat actions (transparency)
CREATE POLICY "Users can view their own cheat actions" ON public.competition_cheat_actions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Admins can view all cheat actions
CREATE POLICY "Admins can view all cheat actions" ON public.competition_cheat_actions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Policy: Admins can insert cheat actions
CREATE POLICY "Admins can insert cheat actions" ON public.competition_cheat_actions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Policy: Admins can update cheat actions
CREATE POLICY "Admins can update cheat actions" ON public.competition_cheat_actions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Policy: Allow system inserts (for automated detection)
-- This allows inserts without authentication context (server-side functions)
CREATE POLICY "System can insert cheat actions" ON public.competition_cheat_actions
  FOR INSERT
  WITH CHECK (true);

-- Create a view for admin dashboard with user details
CREATE OR REPLACE VIEW public.cheat_actions_with_details AS
SELECT 
  ca.id,
  ca.competition_id,
  ca.user_id,
  ca.action_type,
  ca.reason,
  ca.created_by,
  ca.created_at,
  ca.updated_at,
  u.email as user_email,
  u.full_name as user_name,
  admin.email as admin_email,
  admin.full_name as admin_name
FROM public.competition_cheat_actions ca
LEFT JOIN public.users u ON ca.user_id = u.id
LEFT JOIN public.users admin ON ca.created_by = admin.id
ORDER BY ca.created_at DESC;

-- Grant access to the view
GRANT SELECT ON public.cheat_actions_with_details TO authenticated;

-- Add comment to table
COMMENT ON TABLE public.competition_cheat_actions IS 'Central log for all anti-cheat detections and admin actions. Tracks suspicious speed, duplicate devices, honeypot answers, and admin reviews.';

-- Add comments to columns
COMMENT ON COLUMN public.competition_cheat_actions.action_type IS 'Action level: flag (monitoring), block (temporary ban), ban (permanent ban)';
COMMENT ON COLUMN public.competition_cheat_actions.reason IS 'Description of suspicious activity or admin reasoning';
COMMENT ON COLUMN public.competition_cheat_actions.created_by IS 'Admin user who created/updated this action. NULL for system-detected actions';
