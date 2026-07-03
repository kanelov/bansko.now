alter table public.categories
  add column if not exists canonical_url text,
  add column if not exists og_title text,
  add column if not exists og_description text,
  add column if not exists og_image_url text,
  add column if not exists robots_index boolean default true,
  add column if not exists robots_follow boolean default true,
  add column if not exists schema_type text default 'CollectionPage',
  add column if not exists updated_at timestamptz default now();

alter table public.businesses
  add column if not exists canonical_url text,
  add column if not exists og_title text,
  add column if not exists og_description text,
  add column if not exists og_image_url text,
  add column if not exists robots_index boolean default true,
  add column if not exists robots_follow boolean default true,
  add column if not exists schema_type text default 'LocalBusiness';

create table if not exists public.editable_pages (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  eyebrow text,
  excerpt text,
  content text,
  hero_image_url text,
  hero_image_alt text,
  cta_label text,
  cta_url text,
  status text not null default 'published' check (status in ('draft', 'published')),
  seo_title text,
  seo_description text,
  canonical_url text,
  og_title text,
  og_description text,
  og_image_url text,
  robots_index boolean not null default true,
  robots_follow boolean not null default true,
  schema_type text default 'WebPage',
  sort_order integer not null default 100,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.art_studio_services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  image_url text,
  image_alt text,
  button_label text,
  button_url text,
  price_label text,
  features text[] default '{}'::text[],
  is_premium boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 100,
  seo_title text,
  seo_description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

drop trigger if exists editable_pages_set_updated_at on public.editable_pages;
create trigger editable_pages_set_updated_at
before update on public.editable_pages
for each row execute function public.set_updated_at();

drop trigger if exists art_studio_services_set_updated_at on public.art_studio_services;
create trigger art_studio_services_set_updated_at
before update on public.art_studio_services
for each row execute function public.set_updated_at();

create index if not exists editable_pages_status_sort_idx on public.editable_pages(status, sort_order);
create index if not exists editable_pages_slug_idx on public.editable_pages(slug);
create index if not exists art_studio_services_active_sort_idx on public.art_studio_services(is_active, is_premium desc, sort_order);

alter table public.editable_pages enable row level security;
alter table public.art_studio_services enable row level security;

grant select on public.editable_pages to anon;
grant select on public.art_studio_services to anon;
grant select, insert, update, delete on public.editable_pages to authenticated;
grant select, insert, update, delete on public.art_studio_services to authenticated;

drop policy if exists "Published editable pages are public" on public.editable_pages;
create policy "Published editable pages are public"
on public.editable_pages
for select
to anon
using (status = 'published');

drop policy if exists "Admins can read all editable pages" on public.editable_pages;
create policy "Admins can read all editable pages"
on public.editable_pages
for select
to authenticated
using (status = 'published' or public.is_admin());

drop policy if exists "Admins can insert editable pages" on public.editable_pages;
create policy "Admins can insert editable pages"
on public.editable_pages
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update editable pages" on public.editable_pages;
create policy "Admins can update editable pages"
on public.editable_pages
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete editable pages" on public.editable_pages;
create policy "Admins can delete editable pages"
on public.editable_pages
for delete
to authenticated
using (public.is_admin());

drop policy if exists "Active art studio services are public" on public.art_studio_services;
create policy "Active art studio services are public"
on public.art_studio_services
for select
to anon
using (is_active = true);

drop policy if exists "Admins can read all art studio services" on public.art_studio_services;
create policy "Admins can read all art studio services"
on public.art_studio_services
for select
to authenticated
using (is_active = true or public.is_admin());

drop policy if exists "Admins can insert art studio services" on public.art_studio_services;
create policy "Admins can insert art studio services"
on public.art_studio_services
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update art studio services" on public.art_studio_services;
create policy "Admins can update art studio services"
on public.art_studio_services
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete art studio services" on public.art_studio_services;
create policy "Admins can delete art studio services"
on public.art_studio_services
for delete
to authenticated
using (public.is_admin());

insert into public.editable_pages
  (title, slug, eyebrow, excerpt, content, hero_image_url, hero_image_alt, cta_label, cta_url, status, seo_title, seo_description, schema_type, sort_order)
values
  (
    'Bansko NOW',
    'about',
    'За проекта',
    'Местна дигитална платформа за събития, култура, природа, хора и ежедневен живот в Банско.',
    'Bansko NOW е създаден като бързо, красиво и полезно място за откриване на Банско.

Публикуваме статии, местни препоръки, визуални истории, бизнеси и сезонни идеи, които помагат на хората да преживяват града по-близо.',
    null,
    'Bansko NOW',
    null,
    null,
    'published',
    'За Bansko NOW',
    'Bansko NOW е локална lifestyle и културна платформа за Банско и Пирин.',
    'AboutPage',
    10
  ),
  (
    'Пиши на Bansko NOW',
    'contact',
    'Контакт',
    'За събития, препоръки, Art Studio услуги, бизнеси и партньорства.',
    '',
    null,
    'Контакт с Bansko NOW',
    null,
    null,
    'published',
    'Контакт | Bansko NOW',
    'Свържи се с Bansko NOW за събития, препоръки, визуални проекти и локални истории.',
    'ContactPage',
    20
  ),
  (
    'Art Studio към Bansko NOW',
    'art-studio',
    'Визуални истории от Банско',
    'Фотография, fine art печат, платна, визуални решения и авторски продукти, вдъхновени от Банско и Пирин.',
    'Красивите места, събития и лични спомени имат нужда от силно визуално присъствие. Art Studio към Bansko NOW създава арт печат, фотографии, платна и визуални решения с премиум усещане.',
    'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1600&q=80',
    'Фотография и печат в Art Studio',
    'Свържи се за проект',
    '/contact',
    'published',
    'Art Studio в Банско | Bansko NOW',
    'Fine art печат, фотографии, платна и визуални решения, вдъхновени от Банско и Пирин.',
    'Service',
    30
  )
on conflict (slug) do nothing;

insert into public.art_studio_services
  (title, slug, description, image_url, image_alt, button_label, button_url, price_label, features, is_premium, is_active, sort_order)
values
  (
    'Fine Art печат',
    'fine-art-print',
    'Премиум печат върху художествена хартия за фотографии, изложби и лични проекти.',
    'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=80',
    'Fine art печат',
    'Запитай за печат',
    '/contact',
    'по заявка',
    array['Художествени хартии', 'Цветова подготовка', 'Музейно усещане'],
    true,
    true,
    10
  ),
  (
    'Canvas печат',
    'canvas-print',
    'Платна с визуален характер за дом, студио, хотел, ресторант или подарък от Банско.',
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
    'Canvas печат',
    'Виж опции',
    '/contact',
    'размери по избор',
    array['Платно', 'Готово за окачване', 'Снимки от Банско'],
    false,
    true,
    20
  ),
  (
    'Визуално представяне',
    'visual-storytelling',
    'Фотография, дизайн подготовка и кратки визуални истории за събития, места и бизнеси.',
    'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=900&q=80',
    'Визуално представяне',
    'Обсъди проект',
    '/contact',
    'индивидуално',
    array['Фото история', 'Дизайн', 'Локален контекст'],
    false,
    true,
    30
  )
on conflict (slug) do nothing;
