-- Create admin_notifications table
CREATE TABLE IF NOT EXISTS admin_notifications (
    id SERIAL PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('new_ticket', 'new_message')),
    ticket_id INTEGER NOT NULL REFERENCES support(id) ON DELETE CASCADE,
    message_id INTEGER,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add role column to profiles table if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Enable RLS
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to read/write notifications
CREATE POLICY "Admins can manage notifications" ON admin_notifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON admin_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_is_read ON admin_notifications(is_read);

-- Function to create notification for new ticket
CREATE OR REPLACE FUNCTION create_notification_for_new_ticket()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO admin_notifications (type, ticket_id, title, message)
    VALUES ('new_ticket', NEW.id, 'New Support Ticket', 'New support ticket: ' || LEFT(NEW.topic, 50));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create notification for new message
CREATE OR REPLACE FUNCTION create_notification_for_new_message()
RETURNS TRIGGER AS $$
DECLARE
    ticket_topic TEXT;
BEGIN
    -- Get the ticket topic
    SELECT topic INTO ticket_topic FROM support WHERE id = NEW.ticket_id;

    INSERT INTO admin_notifications (type, ticket_id, message_id, title, message)
    VALUES ('new_message', NEW.ticket_id, NEW.id, 'New Message', 'New message in ticket: ' || LEFT(ticket_topic, 50));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_new_ticket_notification ON support;
CREATE TRIGGER trigger_new_ticket_notification
    AFTER INSERT ON support
    FOR EACH ROW
    EXECUTE FUNCTION create_notification_for_new_ticket();

DROP TRIGGER IF EXISTS trigger_new_message_notification ON support_messages;
CREATE TRIGGER trigger_new_message_notification
    AFTER INSERT ON support_messages
    FOR EACH ROW
    EXECUTE FUNCTION create_notification_for_new_message();