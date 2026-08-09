create table if not exists public.business_listing_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  tier text not null default 'free' check (tier in ('free', 'premium', 'homepage')),
  period_months integer not null default 12 check (period_months = 12),
  price numeric(10, 2) default 0,
  currency text not null default 'BGN',
  stripe_payment_link text,
  description text,
  benefits text[] default '{}'::text[],
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category text not null,
  description text,
  address text not null,
  latitude float8,
  longitude float8,
  video_link text,
  website_url text,
  instagram_url text,
  facebook_url text,
  images text[] default '{}'::text[],
  faqs jsonb default '[]'::jsonb,
  features text[] default '{}'::text[],
  status text not null default 'draft' check (status in ('draft', 'approved', 'rejected')),
  listing_tier text not null default 'free' check (listing_tier in ('free', 'premium', 'homepage')),
  requested_plan_id uuid references public.business_listing_plans(id) on delete set null,
  active_plan_id uuid references public.business_listing_plans(id) on delete set null,
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'pending', 'paid', 'expired')),
  paid_until timestamptz,
  is_homepage_spotlight boolean not null default false,
  homepage_spotlight_until timestamptz,
  priority integer not null default 100,
  map_pin_x numeric(5, 2),
  map_pin_y numeric(5, 2),
  show_on_illustrated_map boolean not null default true,
  requested_services text[] default '{}'::text[],
  admin_notes text,
  seo_title text,
  seo_description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.business_contacts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  owner_name text not null,
  owner_phone text,
  owner_email text not null,
  created_at timestamptz default now()
);

create table if not exists public.business_directory_settings (
  id uuid primary key default gen_random_uuid(),
  intro_title text default 'Местни бизнеси в Банско',
  intro_description text default 'Открий места, услуги и локални партньори в Банско.',
  premium_offer_title text default 'Избери как да присъства бизнесът ти',
  premium_offer_description text default 'Безплатното присъствие е по подразбиране. При желание избери годишно ниво за по-силна видимост в Bansko NOW.',
  map_image_url text,
  map_image_alt text default 'Илюстрирана карта на Банско',
  notification_email text,
  about_title text default 'Bansko NOW',
  about_eyebrow text default 'За проекта',
  about_description text default 'Bansko NOW е местна дигитална платформа за събития, култура, природа, хора и ежедневен живот в Банско.',
  about_body text default 'Създаваме чисто, полезно и красиво място за откриване на Банско - от истории и събития до местни бизнеси и визуални проекти.',
  about_image_url text,
  contact_title text default 'Пиши на Bansko NOW',
  contact_description text default 'За събития, препоръки, бизнеси, партньорства и визуални проекти.',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  subject text,
  message text not null,
  status text not null default 'new' check (status in ('new', 'read', 'archived')),
  created_at timestamptz default now()
);

create index if not exists businesses_status_category_idx on public.businesses(status, category);
create index if not exists businesses_public_order_idx on public.businesses(status, listing_tier, paid_until, priority);
create index if not exists businesses_requested_plan_id_idx on public.businesses(requested_plan_id);
create index if not exists businesses_active_plan_id_idx on public.businesses(active_plan_id);
create index if not exists business_contacts_business_id_idx on public.business_contacts(business_id);

alter table public.business_listing_plans enable row level security;
alter table public.businesses enable row level security;
alter table public.business_contacts enable row level security;
alter table public.business_directory_settings enable row level security;
alter table public.contact_messages enable row level security;

grant select on public.business_listing_plans to anon, authenticated;
grant select, insert on public.businesses to anon;
grant select, insert, update, delete on public.businesses to authenticated;
grant insert on public.business_contacts to anon;
grant select, insert, update, delete on public.business_contacts to authenticated;
grant select on public.business_directory_settings to anon, authenticated;
grant insert on public.contact_messages to anon;
grant select, update, delete on public.contact_messages to authenticated;

drop policy if exists "Active business plans are public" on public.business_listing_plans;
create policy "Active business plans are public"
on public.business_listing_plans
for select
to anon, authenticated
using (is_active = true or public.is_admin());

drop policy if exists "Admins can manage business plans" on public.business_listing_plans;
create policy "Admins can manage business plans"
on public.business_listing_plans
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Approved businesses are public" on public.businesses;
create policy "Approved businesses are public"
on public.businesses
for select
to anon, authenticated
using (status = 'approved' or public.is_admin());

drop policy if exists "Public can submit draft businesses" on public.businesses;
create policy "Public can submit draft businesses"
on public.businesses
for insert
to anon
with check (status = 'draft');

drop policy if exists "Admins can manage businesses" on public.businesses;
create policy "Admins can manage businesses"
on public.businesses
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can insert business contacts" on public.business_contacts;
create policy "Public can insert business contacts"
on public.business_contacts
for insert
to anon
with check (true);

drop policy if exists "Admins can manage business contacts" on public.business_contacts;
create policy "Admins can manage business contacts"
on public.business_contacts
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Business directory settings are public" on public.business_directory_settings;
create policy "Business directory settings are public"
on public.business_directory_settings
for select
to anon, authenticated
using (true);

drop policy if exists "Admins can manage business directory settings" on public.business_directory_settings;
create policy "Admins can manage business directory settings"
on public.business_directory_settings
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can insert contact messages" on public.contact_messages;
create policy "Public can insert contact messages"
on public.contact_messages
for insert
to anon
with check (true);

drop policy if exists "Admins can manage contact messages" on public.contact_messages;
create policy "Admins can manage contact messages"
on public.contact_messages
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

insert into storage.buckets (id, name, public)
values ('business-images', 'business-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Business images are public" on storage.objects;
create policy "Business images are public"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'business-images');

drop policy if exists "Public can upload validated business images" on storage.objects;
create policy "Public can upload validated business images"
on storage.objects
for insert
to anon
with check (bucket_id = 'business-images');

drop policy if exists "Admins can delete business images" on storage.objects;
create policy "Admins can delete business images"
on storage.objects
for delete
to authenticated
using (bucket_id = 'business-images' and public.is_admin());

insert into public.business_directory_settings (intro_title)
select 'Местни бизнеси в Банско'
where not exists (select 1 from public.business_directory_settings);

insert into public.business_listing_plans
  (name, slug, tier, period_months, price, currency, description, benefits, sort_order)
values
  ('Безплатно присъствие', 'free-listing', 'free', 12, 0, 'BGN', 'Основен профил в каталога след редакторско одобрение.', array['Профил в каталога', 'Адрес и упътване', 'До 3 снимки'], 10),
  ('Премиум бизнес - 1 година', 'premium-12-months', 'premium', 12, 0, 'BGN', 'Силен визуален акцент и приоритетно позициониране в каталога.', array['Приоритетна позиция', 'Премиум визуален акцент', 'По-видим pin на картата'], 30),
  ('На фокус - 1 година', 'homepage-spotlight-12-months', 'homepage', 12, 0, 'BGN', 'Най-висока видимост в каталога и възможност за представяне на началната страница.', array['Най-висока видимост', 'На фокус на началната страница', 'Премиум визуален блок'], 40)
on conflict (slug) do nothing;
