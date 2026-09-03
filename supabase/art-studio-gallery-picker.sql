-- Art Studio product types can show ready designs from the synced gallery catalog.
-- The relationship is the gallery category's stable id (from the request app), never a name or slug.
alter table public.art_studio_product_types
  add column if not exists gallery_picker_enabled boolean not null default false,
  add column if not exists gallery_category_id text;

comment on column public.art_studio_product_types.gallery_picker_enabled is
  'Show the compact "Готови дизайни" picker above the order form';
comment on column public.art_studio_product_types.gallery_category_id is
  'Root gallery category id (request app inventory_categories.id) whose child categories feed the picker';
