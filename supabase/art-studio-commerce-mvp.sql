-- Bansko NOW Art Studio commerce MVP.
-- Products remain simple: optional text/notes, one selected offer, and lightweight options.

create table if not exists public.art_studio_product_types (
  id uuid primary key default gen_random_uuid(),
  internal_name text not null unique,
  icon_name text,
  image_url text,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.art_studio_product_type_translations (
  product_type_id uuid not null references public.art_studio_product_types(id) on delete cascade,
  locale text not null check (locale in ('bg', 'en')),
  title text not null,
  slug text not null,
  description text,
  image_alt text,
  seo_title text,
  seo_description text,
  og_title text,
  og_description text,
  og_image_url text,
  robots_index boolean not null default true,
  robots_follow boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (product_type_id, locale),
  unique (locale, slug)
);

create table if not exists public.art_studio_categories (
  id uuid primary key default gen_random_uuid(),
  product_type_id uuid not null references public.art_studio_product_types(id) on delete cascade,
  internal_name text not null,
  icon_name text,
  image_url text,
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_type_id, internal_name)
);

create table if not exists public.art_studio_category_translations (
  category_id uuid not null references public.art_studio_categories(id) on delete cascade,
  locale text not null check (locale in ('bg', 'en')),
  title text not null,
  slug text not null,
  description text,
  image_alt text,
  seo_title text,
  seo_description text,
  robots_index boolean not null default true,
  robots_follow boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (category_id, locale)
);

create table if not exists public.art_studio_products (
  id uuid primary key default gen_random_uuid(),
  product_type_id uuid not null references public.art_studio_product_types(id) on delete restrict,
  category_id uuid references public.art_studio_categories(id) on delete set null,
  sku text unique,
  image_url text,
  gallery_urls text[] not null default '{}'::text[],
  personalization_text_enabled boolean not null default true,
  idea_note_enabled boolean not null default true,
  is_featured boolean not null default false,
  is_active boolean not null default false,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.art_studio_product_translations (
  product_id uuid not null references public.art_studio_products(id) on delete cascade,
  locale text not null check (locale in ('bg', 'en')),
  title text not null,
  slug text not null,
  short_description text,
  description text,
  image_alt text,
  seo_title text,
  seo_description text,
  og_title text,
  og_description text,
  og_image_url text,
  robots_index boolean not null default true,
  robots_follow boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (product_id, locale),
  unique (locale, slug)
);

create table if not exists public.art_studio_product_options (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.art_studio_products(id) on delete cascade,
  option_key text not null check (option_key ~ '^[a-z0-9][a-z0-9_-]{0,49}$'),
  label_bg text not null,
  label_en text,
  input_type text not null default 'select' check (input_type in ('select', 'radio', 'swatch')),
  is_required boolean not null default true,
  values jsonb not null default '[]'::jsonb check (jsonb_typeof(values) = 'array'),
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, option_key)
);

create table if not exists public.art_studio_product_offers (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.art_studio_products(id) on delete cascade,
  label_bg text not null,
  label_en text,
  price numeric(10,2) not null check (price >= 0),
  currency text not null default 'EUR' check (currency ~ '^[A-Z]{3}$'),
  payment_link_url text,
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.art_studio_public_settings (
  id uuid primary key default gen_random_uuid(),
  pickup_name_bg text default 'Art Gallery Bansko',
  pickup_name_en text default 'Art Gallery Bansko',
  pickup_address_bg text,
  pickup_address_en text,
  pickup_phone text,
  pickup_instructions_bg text,
  pickup_instructions_en text,
  econt_instructions_bg text default 'Посочи град и предпочитан офис на Еконт.',
  econt_instructions_en text default 'Enter the city and preferred Econt office.',
  orders_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.art_studio_orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  product_id uuid references public.art_studio_products(id) on delete set null,
  offer_id uuid references public.art_studio_product_offers(id) on delete set null,
  product_snapshot jsonb not null,
  locale text not null default 'bg' check (locale in ('bg', 'en')),
  customer_first_name text not null,
  customer_last_name text not null,
  customer_email text not null,
  customer_phone text not null,
  personalization_text text,
  idea_note text,
  quantity integer not null default 1 check (quantity between 1 and 20),
  selected_options jsonb not null default '{}'::jsonb check (jsonb_typeof(selected_options) = 'object'),
  delivery_method text not null check (delivery_method in ('econt_office', 'gallery_pickup')),
  delivery_city text,
  delivery_office text,
  delivery_notes text,
  unit_price numeric(10,2) not null check (unit_price >= 0),
  delivery_price numeric(10,2) not null default 0 check (delivery_price >= 0),
  total numeric(10,2) not null check (total >= 0),
  currency text not null default 'EUR' check (currency ~ '^[A-Z]{3}$'),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'failed', 'expired', 'refunded')),
  production_status text not null default 'new' check (production_status in ('new', 'in_production', 'ready_for_pickup', 'shipped', 'completed', 'cancelled')),
  payment_link_url text,
  stripe_checkout_session_id text unique,
  stripe_payment_link_id text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists art_studio_product_types_set_updated_at on public.art_studio_product_types;
create trigger art_studio_product_types_set_updated_at before update on public.art_studio_product_types
for each row execute function public.set_updated_at();

drop trigger if exists art_studio_product_type_translations_set_updated_at on public.art_studio_product_type_translations;
create trigger art_studio_product_type_translations_set_updated_at before update on public.art_studio_product_type_translations
for each row execute function public.set_updated_at();

drop trigger if exists art_studio_categories_set_updated_at on public.art_studio_categories;
create trigger art_studio_categories_set_updated_at before update on public.art_studio_categories
for each row execute function public.set_updated_at();

drop trigger if exists art_studio_category_translations_set_updated_at on public.art_studio_category_translations;
create trigger art_studio_category_translations_set_updated_at before update on public.art_studio_category_translations
for each row execute function public.set_updated_at();

drop trigger if exists art_studio_products_set_updated_at on public.art_studio_products;
create trigger art_studio_products_set_updated_at before update on public.art_studio_products
for each row execute function public.set_updated_at();

drop trigger if exists art_studio_product_translations_set_updated_at on public.art_studio_product_translations;
create trigger art_studio_product_translations_set_updated_at before update on public.art_studio_product_translations
for each row execute function public.set_updated_at();

drop trigger if exists art_studio_product_options_set_updated_at on public.art_studio_product_options;
create trigger art_studio_product_options_set_updated_at before update on public.art_studio_product_options
for each row execute function public.set_updated_at();

drop trigger if exists art_studio_product_offers_set_updated_at on public.art_studio_product_offers;
create trigger art_studio_product_offers_set_updated_at before update on public.art_studio_product_offers
for each row execute function public.set_updated_at();

drop trigger if exists art_studio_public_settings_set_updated_at on public.art_studio_public_settings;
create trigger art_studio_public_settings_set_updated_at before update on public.art_studio_public_settings
for each row execute function public.set_updated_at();

drop trigger if exists art_studio_orders_set_updated_at on public.art_studio_orders;
create trigger art_studio_orders_set_updated_at before update on public.art_studio_orders
for each row execute function public.set_updated_at();

create index if not exists art_studio_product_types_public_idx
  on public.art_studio_product_types (is_active, is_featured desc, sort_order);
create index if not exists art_studio_product_type_translations_slug_idx
  on public.art_studio_product_type_translations (locale, slug);
create index if not exists art_studio_categories_type_idx
  on public.art_studio_categories (product_type_id, is_active, sort_order);
create index if not exists art_studio_category_translations_slug_idx
  on public.art_studio_category_translations (locale, slug);
create index if not exists art_studio_products_type_public_idx
  on public.art_studio_products (product_type_id, is_active, is_featured desc, sort_order);
create index if not exists art_studio_products_category_idx
  on public.art_studio_products (category_id);
create index if not exists art_studio_product_translations_slug_idx
  on public.art_studio_product_translations (locale, slug);
create index if not exists art_studio_product_options_product_idx
  on public.art_studio_product_options (product_id, sort_order);
create index if not exists art_studio_product_offers_product_idx
  on public.art_studio_product_offers (product_id, is_active, sort_order);
create index if not exists art_studio_orders_created_idx
  on public.art_studio_orders (created_at desc);
create index if not exists art_studio_orders_product_idx
  on public.art_studio_orders (product_id);
create index if not exists art_studio_orders_offer_idx
  on public.art_studio_orders (offer_id);
create index if not exists art_studio_orders_payment_idx
  on public.art_studio_orders (payment_status, created_at desc);
create index if not exists art_studio_orders_production_idx
  on public.art_studio_orders (production_status, created_at desc);
create unique index if not exists art_studio_public_settings_singleton_idx
  on public.art_studio_public_settings ((true));

alter table public.art_studio_product_types enable row level security;
alter table public.art_studio_product_type_translations enable row level security;
alter table public.art_studio_categories enable row level security;
alter table public.art_studio_category_translations enable row level security;
alter table public.art_studio_products enable row level security;
alter table public.art_studio_product_translations enable row level security;
alter table public.art_studio_product_options enable row level security;
alter table public.art_studio_product_offers enable row level security;
alter table public.art_studio_public_settings enable row level security;
alter table public.art_studio_orders enable row level security;

revoke all on table
  public.art_studio_product_types,
  public.art_studio_product_type_translations,
  public.art_studio_categories,
  public.art_studio_category_translations,
  public.art_studio_products,
  public.art_studio_product_translations,
  public.art_studio_product_options,
  public.art_studio_product_offers,
  public.art_studio_public_settings,
  public.art_studio_orders
from public, anon, authenticated;

grant select on public.art_studio_product_types to anon;
grant select on public.art_studio_product_type_translations to anon;
grant select on public.art_studio_categories to anon;
grant select on public.art_studio_category_translations to anon;
grant select on public.art_studio_products to anon;
grant select on public.art_studio_product_translations to anon;
grant select on public.art_studio_product_options to anon;
grant select on public.art_studio_product_offers to anon;
grant select on public.art_studio_public_settings to anon;

grant select, insert, update, delete on public.art_studio_product_types to authenticated;
grant select, insert, update, delete on public.art_studio_product_type_translations to authenticated;
grant select, insert, update, delete on public.art_studio_categories to authenticated;
grant select, insert, update, delete on public.art_studio_category_translations to authenticated;
grant select, insert, update, delete on public.art_studio_products to authenticated;
grant select, insert, update, delete on public.art_studio_product_translations to authenticated;
grant select, insert, update, delete on public.art_studio_product_options to authenticated;
grant select, insert, update, delete on public.art_studio_product_offers to authenticated;
grant select, insert, update, delete on public.art_studio_public_settings to authenticated;
grant select, update, delete on public.art_studio_orders to authenticated;

grant all on public.art_studio_product_types to service_role;
grant all on public.art_studio_product_type_translations to service_role;
grant all on public.art_studio_categories to service_role;
grant all on public.art_studio_category_translations to service_role;
grant all on public.art_studio_products to service_role;
grant all on public.art_studio_product_translations to service_role;
grant all on public.art_studio_product_options to service_role;
grant all on public.art_studio_product_offers to service_role;
grant all on public.art_studio_public_settings to service_role;
grant all on public.art_studio_orders to service_role;

drop policy if exists "Public reads active Art Studio product types" on public.art_studio_product_types;
create policy "Public reads active Art Studio product types" on public.art_studio_product_types
for select to anon using (is_active = true);
drop policy if exists "Admins manage Art Studio product types" on public.art_studio_product_types;
create policy "Admins manage Art Studio product types" on public.art_studio_product_types
for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "Public reads active Art Studio type translations" on public.art_studio_product_type_translations;
create policy "Public reads active Art Studio type translations" on public.art_studio_product_type_translations
for select to anon using (exists (
  select 1 from public.art_studio_product_types parent
  where parent.id = product_type_id and parent.is_active = true
));
drop policy if exists "Admins manage Art Studio type translations" on public.art_studio_product_type_translations;
create policy "Admins manage Art Studio type translations" on public.art_studio_product_type_translations
for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "Public reads active Art Studio categories" on public.art_studio_categories;
create policy "Public reads active Art Studio categories" on public.art_studio_categories
for select to anon using (is_active = true and exists (
  select 1 from public.art_studio_product_types parent
  where parent.id = product_type_id and parent.is_active = true
));
drop policy if exists "Admins manage Art Studio categories" on public.art_studio_categories;
create policy "Admins manage Art Studio categories" on public.art_studio_categories
for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "Public reads active Art Studio category translations" on public.art_studio_category_translations;
create policy "Public reads active Art Studio category translations" on public.art_studio_category_translations
for select to anon using (exists (
  select 1 from public.art_studio_categories category
  join public.art_studio_product_types parent on parent.id = category.product_type_id
  where category.id = category_id and category.is_active = true and parent.is_active = true
));
drop policy if exists "Admins manage Art Studio category translations" on public.art_studio_category_translations;
create policy "Admins manage Art Studio category translations" on public.art_studio_category_translations
for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "Public reads active Art Studio products" on public.art_studio_products;
create policy "Public reads active Art Studio products" on public.art_studio_products
for select to anon using (is_active = true and exists (
  select 1 from public.art_studio_product_types parent
  where parent.id = product_type_id and parent.is_active = true
));
drop policy if exists "Admins manage Art Studio products" on public.art_studio_products;
create policy "Admins manage Art Studio products" on public.art_studio_products
for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "Public reads active Art Studio product translations" on public.art_studio_product_translations;
create policy "Public reads active Art Studio product translations" on public.art_studio_product_translations
for select to anon using (exists (
  select 1 from public.art_studio_products product
  join public.art_studio_product_types parent on parent.id = product.product_type_id
  where product.id = product_id and product.is_active = true and parent.is_active = true
));
drop policy if exists "Admins manage Art Studio product translations" on public.art_studio_product_translations;
create policy "Admins manage Art Studio product translations" on public.art_studio_product_translations
for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "Public reads active Art Studio product options" on public.art_studio_product_options;
create policy "Public reads active Art Studio product options" on public.art_studio_product_options
for select to anon using (exists (
  select 1 from public.art_studio_products product
  where product.id = product_id and product.is_active = true
));
drop policy if exists "Admins manage Art Studio product options" on public.art_studio_product_options;
create policy "Admins manage Art Studio product options" on public.art_studio_product_options
for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "Public reads active Art Studio product offers" on public.art_studio_product_offers;
create policy "Public reads active Art Studio product offers" on public.art_studio_product_offers
for select to anon using (is_active = true and exists (
  select 1 from public.art_studio_products product
  where product.id = product_id and product.is_active = true
));
drop policy if exists "Admins manage Art Studio product offers" on public.art_studio_product_offers;
create policy "Admins manage Art Studio product offers" on public.art_studio_product_offers
for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "Public reads Art Studio delivery settings" on public.art_studio_public_settings;
create policy "Public reads Art Studio delivery settings" on public.art_studio_public_settings
for select to anon using (true);
drop policy if exists "Admins manage Art Studio delivery settings" on public.art_studio_public_settings;
create policy "Admins manage Art Studio delivery settings" on public.art_studio_public_settings
for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "Admins manage Art Studio orders" on public.art_studio_orders;
create policy "Admins manage Art Studio orders" on public.art_studio_orders
for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

insert into public.art_studio_public_settings (orders_enabled)
select true
where not exists (select 1 from public.art_studio_public_settings);
