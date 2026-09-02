-- Order history: archived orders leave the active list in the admin.
-- Set automatically when the request app reports cancelled/deleted/collected, when the admin
-- marks an order completed/cancelled, or manually from the admin.
alter table public.art_studio_orders
  add column if not exists archived_at timestamptz,
  add column if not exists archive_reason text,
  add column if not exists source_status text;

comment on column public.art_studio_orders.archived_at is 'When the order moved to the history tab (null = active)';
comment on column public.art_studio_orders.archive_reason is 'Why it was archived (for example "Изтрита в приложението")';
comment on column public.art_studio_orders.source_status is 'Last status event received from the request app';

create index if not exists art_studio_orders_active_idx
  on public.art_studio_orders (created_at desc)
  where archived_at is null;
