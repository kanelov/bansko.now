-- Art Studio orders are mirrored into the request app (app.kanelov.com) as marked work-queue
-- requests. Store the reservation id and time so the admin can see whether the sync happened.
alter table public.art_studio_orders
  add column if not exists source_request_id uuid,
  add column if not exists source_synced_at timestamptz;

comment on column public.art_studio_orders.source_request_id is
  'gallery_pickup_reservations.id in the request app created automatically for this order';
comment on column public.art_studio_orders.source_synced_at is
  'When the order was registered in the request app work queue';
