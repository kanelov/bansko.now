create index if not exists businesses_requested_plan_id_idx
  on public.businesses(requested_plan_id);

create index if not exists businesses_active_plan_id_idx
  on public.businesses(active_plan_id);
