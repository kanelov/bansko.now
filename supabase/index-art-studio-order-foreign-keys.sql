-- Follow-up for the production migration: cover order foreign keys used by joins and deletes.
create index if not exists art_studio_orders_product_idx
  on public.art_studio_orders (product_id);

create index if not exists art_studio_orders_offer_idx
  on public.art_studio_orders (offer_id);
