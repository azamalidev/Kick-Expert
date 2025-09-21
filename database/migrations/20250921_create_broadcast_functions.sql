-- Consolidated migration: create canonical broadcast RPCs and remove overload ambiguity
-- 1) Drop known conflicting overloads
-- 2) Create canonical advanced implementation: broadcast_notification_advanced(...)
-- 3) Create compatibility shim: broadcast_notification_to_all(...) -> forwards to advanced
-- 4) Create JSON wrapper: broadcast_notification_from_json(jsonb)
-- Run this in staging first.

-- 1) drop conflicting overloads if present
drop function if exists public.broadcast_notification_to_all(text, text, text, text, text, boolean, timestamptz);
drop function if exists public.broadcast_notification_to_all(text, text, text, text, boolean, text, timestamptz);

-- 2) canonical advanced function
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
as $function$
declare
  rec record;
  v_type_norm text;
  _is_promotional boolean;
  v_count int;
  v_target_id uuid;
  v_existing_message text;
  v_existing_expiry timestamptz;
begin
  -- Normalize type to match notifications.type check constraint
  v_type_norm := case lower(coalesce(p_type, ''))
    when 'informational' then 'Info'
    when 'info' then 'Info'
    when 'promotional' then 'Marketing'
    when 'marketing' then 'Marketing'
    when 'support' then 'Support'
    when 'wallet' then 'Wallet'
    when 'game' then 'Game'
    when 'alert' then 'Alert'
    when 'referral' then 'Referral'
    when 'transactional' then 'System'
    when 'system' then 'System'
    else initcap(coalesce(p_type, ''))
  end;

  if v_type_norm is null or v_type_norm = '' then
    v_type_norm := 'Info';
  end if;

  _is_promotional := (lower(v_type_norm) = 'marketing');

  if _is_promotional then
    for rec in select user_id from public.profiles where coalesce(marketing_opt_in, false) = true
    loop
      begin
        select count(*) into v_count from public.notifications
          where user_id = rec.user_id and created_at >= now() - interval '1 hour' and (expiry_date is null or expiry_date > now());

        if v_count < 5 then
          insert into public.notifications (user_id, type, priority, title, message, is_banner, cta_url, expiry_date)
          values (rec.user_id, v_type_norm, p_priority, p_title, p_message, p_is_banner, p_cta_url, p_expiry_date);
        else
          if p_priority = 'low' then
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
            select id into v_target_id
            from public.notifications
            where user_id = rec.user_id and priority = 'low' and created_at >= now() - interval '1 hour'
            order by created_at asc
            limit 1;

            if v_target_id is not null then
              update public.notifications
              set type = v_type_norm,
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
  else
    for rec in select user_id from public.profiles
    loop
      begin
        select count(*) into v_count from public.notifications
          where user_id = rec.user_id and created_at >= now() - interval '1 hour' and (expiry_date is null or expiry_date > now());

        if v_count < 5 then
          insert into public.notifications (user_id, type, priority, title, message, is_banner, cta_url, expiry_date)
          values (rec.user_id, v_type_norm, p_priority, p_title, p_message, p_is_banner, p_cta_url, p_expiry_date);
        else
          if p_priority = 'low' then
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
            select id into v_target_id
            from public.notifications
            where user_id = rec.user_id and priority = 'low' and created_at >= now() - interval '1 hour'
            order by created_at asc
            limit 1;

            if v_target_id is not null then
              update public.notifications
              set type = v_type_norm,
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

-- 3) compatibility shim: old name forwards to advanced implementation
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

-- 4) JSON wrapper: accept a single jsonb payload and forward
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

-- Optional: grant execute to authenticated/anon if you expect them to call this directly.
-- grant execute on function public.broadcast_notification_advanced(text,text,text,text,boolean,text,timestamptz) to authenticated;
-- grant execute on function public.broadcast_notification_from_json(jsonb) to authenticated;
