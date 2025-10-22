-- ============================================
-- FIX CONTACTS TABLE RLS POLICIES
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can insert contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can view their own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Admins can view all contacts" ON public.contacts;
DROP POLICY IF EXISTS "Admins can update contacts" ON public.contacts;

-- Disable RLS temporarily to allow inserts
ALTER TABLE public.contacts DISABLE ROW LEVEL SECURITY;

-- OR if you want to keep RLS, create permissive policies:
-- ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Anyone can insert contacts" ON public.contacts
--   FOR INSERT WITH CHECK (true);

-- CREATE POLICY "Anyone can view contacts" ON public.contacts
--   FOR SELECT USING (true);

-- CREATE POLICY "Admins can update contacts" ON public.contacts
--   FOR UPDATE USING (true);

-- ============================================
-- VERIFY TABLE
-- ============================================
SELECT * FROM public.contacts LIMIT 1;
