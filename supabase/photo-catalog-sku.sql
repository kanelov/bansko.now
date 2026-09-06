-- Link between a photo in the archive and an existing product in the request app catalog
-- (app.kanelov.com). When set, the photo sync updates that catalog row instead of creating
-- a new one with SKU = photo code, so older prints (LNK…) keep their history and counters.
-- Additive and idempotent.
alter table public.photos
  add column if not exists catalog_sku text;
comment on column public.photos.catalog_sku is
  'SKU of the matching product in the request app catalog; empty = the photo code is used as SKU there.';
