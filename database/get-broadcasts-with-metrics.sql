create or replace function public.get_broadcasts_with_metrics()
returns table(
  broadcast_id uuid,
  title text,
  message text,
  type text,
  priority text,
  is_banner boolean,
  schedule_at timestamptz,
  status text,
  created_at timestamptz,
  recipients bigint,
  delivered bigint,
  opened bigint,
  clicked bigint
)
language sql
security definer
as $$
select
  b.id as broadcast_id,
  b.title,
  b.message,
  b.type,
  b.priority,
  b.is_banner,
  b.schedule_at,
  b.status,
  b.created_at,
  count(n.id) as recipients,
  count(n.delivered_at) filter (where n.delivered_at is not null) as delivered,
  count(n.opened_at) filter (where n.opened_at is not null) as opened,
  coalesce(sum(n.clicked_count),0) as clicked
from public.broadcasts b
left join public.notifications n on n.broadcast_id = b.id
group by b.id
order by b.created_at desc;
$$;
