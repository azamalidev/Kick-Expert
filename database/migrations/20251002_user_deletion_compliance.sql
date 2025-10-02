-- 20251002_user_deletion_compliance.sql
-- Trigger for user deletion: delete personal email data, anonymize suppression

CREATE OR REPLACE FUNCTION handle_user_deletion_compliance()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete personal email data
  DELETE FROM public.newsletter_subscribers WHERE email = OLD.email;
  DELETE FROM public.email_consents WHERE user_id = OLD.id;
  DELETE FROM public.email_events_audit WHERE email = OLD.email;

  -- Anonymize suppression: hash the email for compliance
  UPDATE public.email_suppression
  SET email = encode(digest(OLD.email || 'salt', 'sha256'), 'hex')
  WHERE email = OLD.email;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger on users table delete
CREATE TRIGGER user_deletion_compliance_trigger
AFTER DELETE ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_user_deletion_compliance();