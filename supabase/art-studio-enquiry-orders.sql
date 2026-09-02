-- Art Studio: selling landing pages per product type + enquiry-style orders with photo upload.
-- Additive and idempotent. Applied to project rzjyawjdhcedddydmfge on 2026-09-02 (migration art_studio_enquiry_orders).

alter table public.art_studio_product_type_translations
  add column if not exists content text;

alter table public.art_studio_product_types
  add column if not exists form_config jsonb not null default '{}'::jsonb;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.art_studio_product_types'::regclass and conname = 'art_studio_product_types_form_config_object'
  ) then
    alter table public.art_studio_product_types
      add constraint art_studio_product_types_form_config_object check (jsonb_typeof(form_config) = 'object');
  end if;
end;
$$;

alter table public.art_studio_orders
  add column if not exists request_type text not null default 'payment',
  add column if not exists attachment_path text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.art_studio_orders'::regclass and conname = 'art_studio_orders_request_type_check'
  ) then
    alter table public.art_studio_orders
      add constraint art_studio_orders_request_type_check check (request_type in ('payment', 'enquiry'));
  end if;
end;
$$;

create index if not exists art_studio_orders_request_type_created_idx
  on public.art_studio_orders (request_type, created_at desc);

-- Private bucket for customer uploads (service role only; signed URLs for the admin and emails).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'art-studio-orders',
  'art-studio-orders',
  false,
  15728640,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf']::text[]
)
on conflict (id) do update
set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- form_config example (seeded for custom-tshirts, fine-art-prints, mugs-drinkware and icons):
-- {"photo_upload":"optional","quantity":true,"fields":[{"key":"size","label_bg":"Размер","label_en":"Size","required":true,
--   "options":[{"value":"m","label_bg":"M","label_en":"M"}]}]}

notify pgrst, 'reload schema';
