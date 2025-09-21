-- Wrapper RPC: accept a single JSONB payload and forward to the canonical advanced function
-- This avoids parameter ordering issues from PostgREST / Supabase RPC calls
create or replace function public.broadcast_notification_from_json(p_payload jsonb)
returns void
language plpgsql
security definer
as $$
declare
  v_type text := coalesce(p_payload->> 'type', p_payload->> 'p_type');
  v_priority text := coalesce(p_payload->> 'priority', p_payload->> 'p_priority');
  v_title text := coalesce(p_payload->> 'title', p_payload->> 'p_title');
  v_message text := coalesce(p_payload->> 'message', p_payload->> 'p_message');
  v_is_banner boolean := (coalesce(p_payload->> 'is_banner', p_payload->> 'p_is_banner'))::boolean;
  v_cta_url text := coalesce(p_payload->> 'cta_url', p_payload->> 'p_cta_url');
  v_expiry timestamptz := (case when (p_payload ? 'expiry_date') then (p_payload->> 'expiry_date')::timestamptz else null end);
begin
  perform public.broadcast_notification_advanced(
    p_type := coalesce(v_type, 'informational'),
    p_priority := coalesce(v_priority, 'medium'),
    p_title := v_title,
    p_message := v_message,
    p_is_banner := coalesce(v_is_banner, false),
    p_cta_url := v_cta_url,
    p_expiry_date := v_expiry
  );
end;
$$;

-- Grant usage as needed in your environment (optional)
