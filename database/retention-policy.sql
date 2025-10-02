-- Retention Policy Notes:
-- 1. Email consents: Keep indefinitely for compliance, but anonymize on user deletion.
-- 2. Email events audit: Retain for 7 years (GDPR max), then delete.
-- 3. Newsletter subscribers: Delete on user deletion or unsubscribe.
-- 4. Email suppression: Keep hashed indefinitely for compliance.

-- Script to delete old audit logs (run periodically, e.g., monthly)
-- Deletes audit logs older than 7 years

DELETE FROM public.email_events_audit
WHERE created_at < NOW() - INTERVAL '7 years';

-- Optional: Archive before delete (not implemented here)

-- Note: Suppression logs are kept with hashed emails for compliance.