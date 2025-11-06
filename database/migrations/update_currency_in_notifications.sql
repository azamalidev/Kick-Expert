-- Update currency symbols in existing notifications from $ to €
-- This updates any notifications that still reference dollars/USD to euros/EUR

-- Update notification messages that contain dollar references
UPDATE public.notifications
SET 
  message = REPLACE(REPLACE(REPLACE(message, ' dollars', ' euros'), 'dollar', 'euro'), '$', '€'),
  title = REPLACE(REPLACE(REPLACE(title, ' dollars', ' euros'), 'dollar', 'euro'), '$', '€')
WHERE 
  message LIKE '%$%' OR 
  message LIKE '%dollar%' OR 
  title LIKE '%$%' OR 
  title LIKE '%dollar%';

-- Log the update
SELECT COUNT(*) as updated_notifications_count
FROM public.notifications
WHERE 
  message LIKE '%€%' OR 
  message LIKE '%euro%';
