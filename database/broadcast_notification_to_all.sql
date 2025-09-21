-- Broadcast notifications to users (INSERT ... SELECT)
-- Respects marketing opt-in when type = 'marketing'
-- To avoid overloaded-function ambiguity, drop the previous conflicting overloads
drop function if exists public.broadcast_notification_to_all(text, text, text, text, text, boolean, timestamptz);
drop function if exists public.broadcast_notification_to_all(text, text, text, text, boolean, text, timestamptz);

-- Create a lightweight compatibility shim that forwards to the advanced function
create or replace function public.broadcast_notification_to_all(
  p_title text,
  p_message text,
  p_type text default 'informational',
  p_priority text default 'medium',
  p_cta_url text default null,
  p_is_banner boolean default false,
  p_expiry_date timestamptz default null
)
returns void
language plpgsql
security definer
as $$
begin
  -- Forward to the canonical advanced implementation to keep a single unambiguous target
  perform public.broadcast_notification_advanced(
    p_type := p_type,
    p_priority := p_priority,
    p_title := p_title,
    p_message := p_message,
    p_is_banner := p_is_banner,
    p_cta_url := p_cta_url,
    p_expiry_date := p_expiry_date
  );
end;
$$;

-- Note: Run this in a safe environment (staging) first. For very large user bases consider batching or a worker queue.
