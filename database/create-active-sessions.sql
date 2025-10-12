-- Table to track active user sessions across devices
CREATE TABLE IF NOT EXISTS public.user_active_sessions (
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fingerprint_id TEXT NOT NULL,
  device_info JSONB,
  login_time TIMESTAMPTZ DEFAULT NOW(),
  last_active TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  competition_id TEXT DEFAULT 'global_login',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_active_session_per_user UNIQUE(user_id, is_active) DEFERRABLE INITIALLY DEFERRED
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_active_sessions_user ON public.user_active_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_fingerprint ON public.user_active_sessions(fingerprint_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_active ON public.user_active_sessions(is_active) WHERE is_active = true;

-- Function to update last_active timestamp
CREATE OR REPLACE FUNCTION update_last_active_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_active = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update last_active
DROP TRIGGER IF EXISTS update_session_last_active ON public.user_active_sessions;
CREATE TRIGGER update_session_last_active
BEFORE UPDATE ON public.user_active_sessions
FOR EACH ROW
EXECUTE FUNCTION update_last_active_timestamp();

-- Enable RLS
ALTER TABLE public.user_active_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own sessions" ON public.user_active_sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON public.user_active_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON public.user_active_sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON public.user_active_sessions;

-- Policy: Users can read their own sessions
CREATE POLICY "Users can read own sessions" ON public.user_active_sessions
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own sessions
CREATE POLICY "Users can insert own sessions" ON public.user_active_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own sessions
CREATE POLICY "Users can update own sessions" ON public.user_active_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own sessions
CREATE POLICY "Users can delete own sessions" ON public.user_active_sessions
  FOR DELETE USING (auth.uid() = user_id);
