-- Bansko Photo Library: photo archive, licensing and the link to articles.
-- Master files stay in Google Drive; public derivatives live in Cloudflare R2.
-- Additive and idempotent; nothing here touches the existing media/articles flow.

create extension if not exists "pgcrypto";

-- Human readable photo codes: BNK-000001
create sequence if not exists public.photo_code_seq start 1;

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  photo_code text not null unique default 'BNK-' || lpad(nextval('public.photo_code_seq')::text, 6, '0'),
  slug text not null unique,

  -- Pricing tier; prices themselves live on the license types so they stay editable.
  price_tier text not null default 'standard' check (price_tier in ('standard', 'premium')),
  price_override_web numeric(10, 2),
  price_override_print numeric(10, 2),

  title_bg text not null,
  title_en text,
  description_bg text,
  description_en text,
  alt_bg text,
  alt_en text,
  caption_bg text,
  caption_en text,

  location_name text,
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  date_taken date,
  year_taken integer,
  season text check (season is null or season in ('winter', 'spring', 'summer', 'autumn')),

  orientation text check (orientation is null or orientation in ('landscape', 'portrait', 'square')),
  width integer,
  height integer,
  camera_model text,
  lens text,

  category text,
  tags text[] not null default '{}',

  -- Storage: master in Drive, derivatives in R2 (object keys, never full URLs).
  master_source text not null default 'google_drive',
  google_drive_file_id text,
  thumb_key text,
  article_key text,
  preview_key text,
  web_license_key text,
  full_resolution_key text,
  dominant_color text,

  is_published boolean not null default false,
  is_featured boolean not null default false,
  licensing_enabled boolean not null default true,
  print_enabled boolean not null default true,

  -- Copyright monitoring stays a simple status until a provider API is available.
  monitoring_status text not null default 'not_submitted'
    check (monitoring_status in ('not_submitted', 'submitted', 'monitoring', 'disabled')),
  monitoring_reference text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create index if not exists photos_published_idx on public.photos (is_published, published_at desc);
create index if not exists photos_category_idx on public.photos (category) where is_published;
create index if not exists photos_location_idx on public.photos (location_name) where is_published;
create index if not exists photos_year_idx on public.photos (year_taken) where is_published;
create index if not exists photos_tags_idx on public.photos using gin (tags);
create index if not exists photos_drive_idx on public.photos (google_drive_file_id);

-- License types with a price per tier, all editable from the admin.
create table if not exists public.photo_license_types (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name_bg text not null,
  name_en text not null,
  summary_bg text,
  summary_en text,
  download_variant text not null check (download_variant in ('web_license', 'full_resolution')),
  price_standard_eur numeric(10, 2) not null,
  price_premium_eur numeric(10, 2) not null,
  print_run_limit integer,
  terms_bg text not null default '',
  terms_en text not null default '',
  terms_version integer not null default 1,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One photo, many articles. The article renderer reuses the same derivative.
create table if not exists public.article_photos (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  photo_id uuid not null references public.photos(id) on delete restrict,
  usage_type text not null default 'inline' check (usage_type in ('featured', 'inline', 'gallery')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (article_id, photo_id, usage_type)
);
create index if not exists article_photos_photo_idx on public.article_photos (photo_id);

-- Import queue for the Google Drive READY folder; idempotent per source file.
create table if not exists public.photo_import_jobs (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'google_drive',
  source_file_id text not null,
  source_filename text not null default '',
  status text not null default 'queued' check (status in ('queued', 'processing', 'completed', 'failed')),
  photo_id uuid references public.photos(id) on delete set null,
  error_message text,
  attempts integer not null default 0,
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  unique (source, source_file_id)
);
create index if not exists photo_import_jobs_status_idx on public.photo_import_jobs (status, created_at);

-- Purchases. The exact license text is frozen on every paid order.
create sequence if not exists public.photo_license_order_seq start 1;

create table if not exists public.photo_license_orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null unique
    default 'PL-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.photo_license_order_seq')::text, 5, '0'),
  photo_id uuid not null references public.photos(id) on delete restrict,
  license_type_id uuid not null references public.photo_license_types(id) on delete restrict,
  license_code text not null,
  license_version integer not null,
  license_terms_snapshot text not null,
  locale text not null default 'bg' check (locale in ('bg', 'en')),

  customer_email text not null,
  customer_name text,
  company_name text,

  amount numeric(10, 2) not null,
  currency text not null default 'EUR',
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'refunded')),

  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  stripe_event_id text,

  download_token text not null unique default encode(gen_random_bytes(24), 'hex'),
  download_count integer not null default 0,
  last_download_at timestamptz,

  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index if not exists photo_license_orders_photo_idx on public.photo_license_orders (photo_id, created_at desc);
create index if not exists photo_license_orders_status_idx on public.photo_license_orders (status, created_at desc);

-- Keep updated_at fresh with the pattern already used by the project.
create or replace function public.set_photo_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_photos_updated_at on public.photos;
create trigger trg_photos_updated_at before update on public.photos
for each row execute function public.set_photo_updated_at();

drop trigger if exists trg_photo_license_types_updated_at on public.photo_license_types;
create trigger trg_photo_license_types_updated_at before update on public.photo_license_types
for each row execute function public.set_photo_updated_at();

-- RLS: visitors read published photos and active license types, nothing else.
alter table public.photos enable row level security;
alter table public.photo_license_types enable row level security;
alter table public.article_photos enable row level security;
alter table public.photo_import_jobs enable row level security;
alter table public.photo_license_orders enable row level security;

drop policy if exists "Published photos are public" on public.photos;
create policy "Published photos are public" on public.photos
for select to anon, authenticated using (is_published);

drop policy if exists "Admins manage photos" on public.photos;
create policy "Admins manage photos" on public.photos
for all to authenticated using (true) with check (true);

drop policy if exists "Active license types are public" on public.photo_license_types;
create policy "Active license types are public" on public.photo_license_types
for select to anon, authenticated using (is_active);

drop policy if exists "Admins manage license types" on public.photo_license_types;
create policy "Admins manage license types" on public.photo_license_types
for all to authenticated using (true) with check (true);

drop policy if exists "Article photo links are public" on public.article_photos;
create policy "Article photo links are public" on public.article_photos
for select to anon, authenticated using (true);

drop policy if exists "Admins manage article photos" on public.article_photos;
create policy "Admins manage article photos" on public.article_photos
for all to authenticated using (true) with check (true);

drop policy if exists "Admins read import jobs" on public.photo_import_jobs;
drop policy if exists "Admins manage import jobs" on public.photo_import_jobs;
create policy "Admins manage import jobs" on public.photo_import_jobs
for all to authenticated using (true) with check (true);

drop policy if exists "Admins read license orders" on public.photo_license_orders;
create policy "Admins read license orders" on public.photo_license_orders
for select to authenticated using (true);

grant select on public.photos to anon, authenticated;
grant select on public.photo_license_types to anon, authenticated;
grant select on public.article_photos to anon, authenticated;
grant select, insert, update, delete on public.photos to authenticated;
grant select, insert, update, delete on public.photo_license_types to authenticated;
grant select, insert, update, delete on public.article_photos to authenticated;
grant select, insert, update, delete on public.photo_import_jobs to authenticated;
grant select on public.photo_license_orders to authenticated;
revoke all on public.photo_license_orders from anon;
revoke all on public.photo_import_jobs from anon;
