-- This migration creates a uniquely named, advanced broadcast function to avoid overload ambiguity
-- It will drop older conflicting overloads of `broadcast_notification_to_all` (if present) before creating the new function.
-- Usage: SELECT broadcast_notification_advanced('promotional','high','Title','Body', true, 'https://example.com', '2025-09-30');

-- Drop potentially conflicting overloads (two known signatures) to avoid "could not choose best candidate" errors
drop function if exists public.broadcast_notification_to_all(text, text, text, text, text, boolean, timestamptz);
drop function if exists public.broadcast_notification_to_all(text, text, text, text, boolean, text, timestamptz);

create or replace function public.broadcast_notification_advanced(
  p_type text,
  p_priority text,
  p_title text,
  p_message text,
  p_is_banner boolean DEFAULT false,
  p_cta_url text DEFAULT null,
  p_expiry_date timestamptz DEFAULT (now() + '90 days'::interval)
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  rec record;
  _is_promotional boolean := (p_type = 'promotional');
  v_count int;
  v_target_id uuid;
  v_existing_message text;
  v_existing_expiry timestamptz;
begin
  -- Insert for all users, but if promotional, only for users who opted in
  if _is_promotional then
    for rec in select user_id from public.profiles where coalesce(marketing_opt_in, false) = true
    loop
      begin
        -- Rate limiting: max 5 notifications per user per last 1 hour
        select count(*) into v_count from public.notifications
          where user_id = rec.user_id and created_at >= now() - interval '1 hour' and (expiry_date is null or expiry_date > now());

        if v_count < 5 then
          insert into public.notifications (user_id, type, priority, title, message, is_banner, cta_url, expiry_date)
          values (rec.user_id, p_type, p_priority, p_title, p_message, p_is_banner, p_cta_url, p_expiry_date);
        else
          -- limit exceeded
          if p_priority = 'low' then
            -- merge into latest low-priority notification within last hour
            select id, message, expiry_date into v_target_id, v_existing_message, v_existing_expiry
            from public.notifications
            where user_id = rec.user_id and priority = 'low' and created_at >= now() - interval '1 hour'
            order by created_at desc
            limit 1;

            if v_target_id is not null then
              update public.notifications
              set message = coalesce(v_existing_message,'') || E'\n\n' || p_message,
                  expiry_date = greatest(coalesce(v_existing_expiry, now()), coalesce(p_expiry_date, now() + interval '90 days')),
                  is_read = false
              where id = v_target_id;
            end if;
          else
            -- for medium/high: replace oldest low-priority within last hour if exists, else skip
            select id into v_target_id
            from public.notifications
            where user_id = rec.user_id and priority = 'low' and created_at >= now() - interval '1 hour'
            order by created_at asc
            limit 1;

            if v_target_id is not null then
              update public.notifications
              set type = p_type,
                  priority = p_priority,
                  title = p_title,
                  message = p_message,
                  cta_url = p_cta_url,
                  expiry_date = coalesce(p_expiry_date, expiry_date),
                  is_banner = p_is_banner,
                  is_read = false,
                  created_at = now()
              where id = v_target_id;
            end if;
          end if;
        end if;
      exception when unique_violation then
        -- ignore duplicates
        null;
      end;
    end loop;
  else
    for rec in select user_id from public.profiles
    loop
      begin
        -- Rate limiting: max 5 notifications per user per last 1 hour
        select count(*) into v_count from public.notifications
          where user_id = rec.user_id and created_at >= now() - interval '1 hour' and (expiry_date is null or expiry_date > now());

        if v_count < 5 then
          insert into public.notifications (user_id, type, priority, title, message, is_banner, cta_url, expiry_date)
          values (rec.user_id, p_type, p_priority, p_title, p_message, p_is_banner, p_cta_url, p_expiry_date);
        else
          -- limit exceeded
          if p_priority = 'low' then
            -- merge into latest low-priority notification within last hour
            select id, message, expiry_date into v_target_id, v_existing_message, v_existing_expiry
            from public.notifications
            where user_id = rec.user_id and priority = 'low' and created_at >= now() - interval '1 hour'
            order by created_at desc
            limit 1;

            if v_target_id is not null then
              update public.notifications
              set message = coalesce(v_existing_message,'') || E'\n\n' || p_message,
                  expiry_date = greatest(coalesce(v_existing_expiry, now()), coalesce(p_expiry_date, now() + interval '90 days')),
                  is_read = false
              where id = v_target_id;
            end if;
          else
            -- for medium/high: replace oldest low-priority within last hour if exists, else skip
            select id into v_target_id
            from public.notifications
            where user_id = rec.user_id and priority = 'low' and created_at >= now() - interval '1 hour'
            order by created_at asc
            limit 1;

            if v_target_id is not null then
              update public.notifications
              set type = p_type,
                  priority = p_priority,
                  title = p_title,
                  message = p_message,
                  cta_url = p_cta_url,
                  expiry_date = coalesce(p_expiry_date, expiry_date),
                  is_banner = p_is_banner,
                  is_read = false,
                  created_at = now()
              where id = v_target_id;
            end if;
          end if;
        end if;
      exception when unique_violation then
        null;
      end;
    end loop;
  end if;
end;
$function$;

-- Grant execute to the anon and authenticated roles as appropriate (optional)
-- The function is SECURITY DEFINER; when calling from the API using service role, ensure proper access control.
