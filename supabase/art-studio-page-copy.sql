-- Editable Art Studio page texts and example design thumbnails.
alter table public.art_studio_public_settings
  add column if not exists page_copy jsonb not null default '{}'::jsonb;
comment on column public.art_studio_public_settings.page_copy is
  'Overrides for the Art Studio landing and product type texts: { landing: { bg, en }, types: { <internal_name>: { bg, en } } }';

alter table public.art_studio_product_types
  add column if not exists gallery_urls text[] not null default '{}';
comment on column public.art_studio_product_types.gallery_urls is
  'Example design images shown as thumbnails on the product type page';
