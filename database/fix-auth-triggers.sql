-- fix-auth-triggers.sql
-- Safe fixes to avoid confirmation failures when auth triggers throw errors.
-- Run in a development environment first. Review and adapt before applying to production.

-- 1) Create notifications table if missing (idempotent)
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  type text NOT NULL,
  priority text,
  title text NOT NULL,
  message text,
  cta_url text,
  status text DEFAULT 'unread',
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 2) Create a simple admin error log for trigger errors
CREATE TABLE IF NOT EXISTS public.admin_trigger_errors (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  trigger_name text NOT NULL,
  user_id uuid,
  payload jsonb,
  err text,
  created_at timestamptz DEFAULT now()
);

-- 3) Ensure RLS is enabled (optional) and create a permissive insert policy for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Allow inserts from triggers/functions (system) - permissive for now
DROP POLICY IF EXISTS notifications_system_insert ON public.notifications;
CREATE POLICY notifications_system_insert
  ON public.notifications
  FOR INSERT
  USING (true)
  WITH CHECK (true);

-- 4) Replace handle_auth_user_email_confirmed with a safe SECURITY DEFINER version
CREATE OR REPLACE FUNCTION public.handle_auth_user_email_confirmed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  BEGIN
    -- If this is an insert and the new row has email_confirmed_at set
    IF TG_OP = 'INSERT' THEN
      IF NEW.email_confirmed_at IS NOT NULL THEN
        INSERT INTO public.notifications (user_id, type, priority, title, message, cta_url, status, created_at)
        VALUES (
          NEW.id,
          'transactional',
          'high',
          'Welcome to KickExpert!',
          'Congrats — your email has been confirmed. Welcome to KickExpert!',
          '/dashboard',
          'unread',
          now()
        );
      END IF;
    END IF;

    -- If this is an update and email_confirmed_at changed from NULL to a timestamp
    IF TG_OP = 'UPDATE' THEN
      IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
        INSERT INTO public.notifications (user_id, type, priority, title, message, cta_url, status, created_at)
        VALUES (
          NEW.id,
          'transactional',
          'high',
          'Welcome to KickExpert!',
          'Congrats — your email has been confirmed. Welcome to KickExpert!',
          '/dashboard',
          'unread',
          now()
        );
      END IF;
    END IF;

  EXCEPTION WHEN OTHERS THEN
    -- Log the error but DO NOT raise to avoid aborting the auth transaction
    PERFORM public.admin_trigger_errors(trigger_name := 'handle_auth_user_email_confirmed', user_id := NEW.id, payload := row_to_json(NEW), err := SQLERRM);
    RAISE NOTICE 'handle_auth_user_email_confirmed error for user %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

-- 5) Drop overlapping trigger and recreate a single targeted trigger
DROP TRIGGER IF EXISTS trigger_on_auth_users_email_confirmed ON auth.users;
DROP TRIGGER IF EXISTS trg_auth_user_email_confirmed ON auth.users;

CREATE TRIGGER trg_auth_user_email_confirmed
AFTER INSERT OR UPDATE ON auth.users
FOR EACH ROW
WHEN (OLD.email_confirmed_at IS DISTINCT FROM NEW.email_confirmed_at)
EXECUTE FUNCTION public.handle_auth_user_email_confirmed();

-- 6) Ensure handle_new_auth_user exists and is SECURITY DEFINER (your function already showed this)
-- We keep it as-is; wrap any heavy logic similarly if needed.

-- Done
