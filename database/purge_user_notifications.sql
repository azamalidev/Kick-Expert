-- Purge notifications for a deleted user
create or replace function public.purge_user_notifications(p_user uuid)
returns void
language plpgsql
security definer
as $$
begin
  delete from public.notifications where user_id = p_user;
end;
$$;
