create extension if not exists "pgcrypto";

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  seo_title text,
  seo_description text,
  created_at timestamptz default now()
);

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  content text not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'scheduled')),
  category_id uuid references public.categories(id) on delete set null,
  featured_image_url text,
  featured_image_alt text,
  published_at timestamptz,
  scheduled_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  seo_title text,
  seo_description text,
  focus_keyword text,
  canonical_url text,
  og_title text,
  og_description text,
  og_image_url text,
  robots_index boolean default true,
  robots_follow boolean default true,
  reading_time integer,
  author_name text default 'Любо Канелов',
  source_links jsonb default '[]'::jsonb,
  internal_link_suggestions jsonb default '[]'::jsonb,
  schema_type text default 'Article',
  is_featured boolean default false,
  is_homepage_highlight boolean default false,
  show_facebook_cta boolean default true,
  show_art_studio_block boolean default false,
  show_bansko_collection_block boolean default false
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz default now()
);

create table if not exists public.article_tags (
  article_id uuid references public.articles(id) on delete cascade,
  tag_id uuid references public.tags(id) on delete cascade,
  primary key (article_id, tag_id)
);

create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  file_url text not null,
  file_name text,
  alt_text text,
  caption text,
  created_at timestamptz default now()
);

create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  site_name text default 'Bansko NOW',
  site_description text,
  facebook_group_url text,
  instagram_url text,
  youtube_url text,
  default_og_image text,
  hero_media_type text default 'image' check (hero_media_type in ('image', 'video', 'embed')),
  hero_image_url text,
  hero_image_alt text,
  hero_video_url text,
  hero_video_poster_url text,
  hero_embed_url text,
  default_author_name text default 'Любо Канелов',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.navigation_items (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  href text not null,
  icon_name text,
  sort_order integer not null default 100,
  is_external boolean not null default false,
  open_in_new_tab boolean not null default false,
  is_active boolean not null default true,
  aria_label text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists navigation_items_href_unique_idx
on public.navigation_items (href);

create table if not exists public.social_links (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  label text not null,
  url text not null,
  icon_name text,
  sort_order integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists social_links_platform_unique_idx
on public.social_links (platform);

alter table public.site_settings
  add column if not exists hero_media_type text default 'image' check (hero_media_type in ('image', 'video', 'embed')),
  add column if not exists hero_image_url text,
  add column if not exists hero_image_alt text,
  add column if not exists hero_video_url text,
  add column if not exists hero_video_poster_url text,
  add column if not exists hero_embed_url text;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path = public
as $$
  select
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
    or coalesce((auth.jwt() -> 'app_metadata' -> 'roles') ? 'admin', false);
$$;

drop trigger if exists articles_set_updated_at on public.articles;
create trigger articles_set_updated_at
before update on public.articles
for each row execute function public.set_updated_at();

drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at
before update on public.site_settings
for each row execute function public.set_updated_at();

drop trigger if exists navigation_items_set_updated_at on public.navigation_items;
create trigger navigation_items_set_updated_at
before update on public.navigation_items
for each row execute function public.set_updated_at();

drop trigger if exists social_links_set_updated_at on public.social_links;
create trigger social_links_set_updated_at
before update on public.social_links
for each row execute function public.set_updated_at();

create index if not exists articles_status_published_at_idx on public.articles(status, published_at desc);
create index if not exists articles_category_id_idx on public.articles(category_id);
create index if not exists articles_is_featured_idx on public.articles(is_featured) where is_featured = true;
create index if not exists article_tags_tag_id_idx on public.article_tags(tag_id);
create index if not exists categories_slug_idx on public.categories(slug);
create index if not exists tags_slug_idx on public.tags(slug);
create index if not exists navigation_items_active_sort_idx on public.navigation_items(is_active, sort_order);
create index if not exists social_links_active_sort_idx on public.social_links(is_active, sort_order);

alter table public.articles enable row level security;
alter table public.categories enable row level security;
alter table public.tags enable row level security;
alter table public.article_tags enable row level security;
alter table public.media enable row level security;
alter table public.site_settings enable row level security;
alter table public.navigation_items enable row level security;
alter table public.social_links enable row level security;

grant select on public.articles to anon;
grant select on public.categories to anon;
grant select on public.tags to anon;
grant select on public.article_tags to anon;
grant select on public.media to anon;
grant select on public.site_settings to anon;
grant select on public.navigation_items to anon;
grant select on public.social_links to anon;

grant select, insert, update, delete on public.articles to authenticated;
grant select, insert, update, delete on public.categories to authenticated;
grant select, insert, update, delete on public.tags to authenticated;
grant select, insert, update, delete on public.article_tags to authenticated;
grant select, insert, update, delete on public.media to authenticated;
grant select, insert, update, delete on public.site_settings to authenticated;
grant select, insert, update, delete on public.navigation_items to authenticated;
grant select, insert, update, delete on public.social_links to authenticated;

drop policy if exists "Published articles are public" on public.articles;
create policy "Published articles are public"
on public.articles
for select
to anon
using (status = 'published' and (published_at is null or published_at <= now()));

drop policy if exists "Admins can read all articles" on public.articles;
create policy "Admins can read all articles"
on public.articles
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can insert articles" on public.articles;
create policy "Admins can insert articles"
on public.articles
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update articles" on public.articles;
create policy "Admins can update articles"
on public.articles
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete articles" on public.articles;
create policy "Admins can delete articles"
on public.articles
for delete
to authenticated
using (public.is_admin());

drop policy if exists "Categories are public" on public.categories;
create policy "Categories are public"
on public.categories
for select
to anon, authenticated
using (true);

drop policy if exists "Admins can manage categories" on public.categories;
drop policy if exists "Admins can insert categories" on public.categories;
create policy "Admins can insert categories"
on public.categories
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update categories" on public.categories;
create policy "Admins can update categories"
on public.categories
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete categories" on public.categories;
create policy "Admins can delete categories"
on public.categories
for delete
to authenticated
using (public.is_admin());

drop policy if exists "Tags are public" on public.tags;
create policy "Tags are public"
on public.tags
for select
to anon, authenticated
using (true);

drop policy if exists "Admins can manage tags" on public.tags;
drop policy if exists "Admins can insert tags" on public.tags;
create policy "Admins can insert tags"
on public.tags
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update tags" on public.tags;
create policy "Admins can update tags"
on public.tags
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete tags" on public.tags;
create policy "Admins can delete tags"
on public.tags
for delete
to authenticated
using (public.is_admin());

drop policy if exists "Published article tags are public" on public.article_tags;
create policy "Published article tags are public"
on public.article_tags
for select
to anon
using (
  exists (
    select 1
    from public.articles
    where articles.id = article_tags.article_id
      and articles.status = 'published'
      and (articles.published_at is null or articles.published_at <= now())
  )
);

drop policy if exists "Admins can manage article tags" on public.article_tags;
drop policy if exists "Admins can read article tags" on public.article_tags;
create policy "Admins can read article tags"
on public.article_tags
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can insert article tags" on public.article_tags;
create policy "Admins can insert article tags"
on public.article_tags
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update article tags" on public.article_tags;
create policy "Admins can update article tags"
on public.article_tags
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete article tags" on public.article_tags;
create policy "Admins can delete article tags"
on public.article_tags
for delete
to authenticated
using (public.is_admin());

drop policy if exists "Media is public" on public.media;
create policy "Media is public"
on public.media
for select
to anon, authenticated
using (true);

drop policy if exists "Admins can manage media" on public.media;
drop policy if exists "Admins can insert media" on public.media;
create policy "Admins can insert media"
on public.media
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update media" on public.media;
create policy "Admins can update media"
on public.media
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete media" on public.media;
create policy "Admins can delete media"
on public.media
for delete
to authenticated
using (public.is_admin());

drop policy if exists "Site settings are public" on public.site_settings;
create policy "Site settings are public"
on public.site_settings
for select
to anon, authenticated
using (true);

drop policy if exists "Admins can manage site settings" on public.site_settings;
drop policy if exists "Admins can insert site settings" on public.site_settings;
create policy "Admins can insert site settings"
on public.site_settings
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update site settings" on public.site_settings;
create policy "Admins can update site settings"
on public.site_settings
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete site settings" on public.site_settings;
create policy "Admins can delete site settings"
on public.site_settings
for delete
to authenticated
using (public.is_admin());

drop policy if exists "Active navigation items are public" on public.navigation_items;
create policy "Active navigation items are public"
on public.navigation_items
for select
to anon
using (is_active = true);

drop policy if exists "Admins can read all navigation items" on public.navigation_items;
drop policy if exists "Authenticated users can read active navigation items and admins all" on public.navigation_items;
create policy "Authenticated users can read active navigation items and admins all"
on public.navigation_items
for select
to authenticated
using (is_active = true or (select public.is_admin()));

drop policy if exists "Admins can insert navigation items" on public.navigation_items;
create policy "Admins can insert navigation items"
on public.navigation_items
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update navigation items" on public.navigation_items;
create policy "Admins can update navigation items"
on public.navigation_items
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete navigation items" on public.navigation_items;
create policy "Admins can delete navigation items"
on public.navigation_items
for delete
to authenticated
using (public.is_admin());

drop policy if exists "Active social links are public" on public.social_links;
create policy "Active social links are public"
on public.social_links
for select
to anon
using (is_active = true);

drop policy if exists "Admins can read all social links" on public.social_links;
drop policy if exists "Authenticated users can read active social links and admins all" on public.social_links;
create policy "Authenticated users can read active social links and admins all"
on public.social_links
for select
to authenticated
using (is_active = true or (select public.is_admin()));

drop policy if exists "Admins can insert social links" on public.social_links;
create policy "Admins can insert social links"
on public.social_links
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update social links" on public.social_links;
create policy "Admins can update social links"
on public.social_links
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete social links" on public.social_links;
create policy "Admins can delete social links"
on public.social_links
for delete
to authenticated
using (public.is_admin());

insert into public.categories (name, slug, description, seo_title, seo_description)
values
  ('Сега', 'now', 'Какво се случва днес, тази седмица и този сезон в Банско.', 'Сега в Банско | Bansko NOW', 'Актуални идеи, събития и полезни новини за Банско.'),
  ('Събития', 'events', 'Културни прояви, фестивали, концерти, изложби и инициативи в Банско и региона.', 'Събития в Банско | Bansko NOW', 'Фестивали, концерти, изложби и интересни събития в Банско.'),
  ('Открий Банско', 'explore', 'Места, разходки, гледки и маршрути за по-близко преживяване на града.', 'Открий Банско | Bansko NOW', 'Пътеводител за места, квартали, маршрути и идеи в Банско.'),
  ('Природа', 'nature', 'Пирин, пътеки, сезони, гледки и отговорно преживяване на планината.', 'Природа и Пирин | Bansko NOW', 'Маршрути, сезонни идеи и природни истории от Пирин.'),
  ('Култура', 'culture', 'Музика, традиции, изложби, занаяти и хората зад културния живот на Банско.', 'Култура в Банско | Bansko NOW', 'Културни истории, фестивали и традиции от Банско.'),
  ('Живот в Банско', 'living', 'Практична и човешка гледна точка към ежедневието в планинския град.', 'Живот в Банско | Bansko NOW', 'Ежедневие, общност и полезна информация за живота в Банско.'),
  ('Храна и места', 'food', 'Вкусове, уютни места, сезонни препоръки и локални преживявания.', 'Храна и места в Банско | Bansko NOW', 'Ресторанти, кафета, местни вкусове и препоръки в Банско.'),
  ('Art Studio', 'art-studio', 'Фотография, арт печат, платна и визуални решения, вдъхновени от Банско.', 'Art Studio към Bansko NOW', 'Fine art печат, фотографии, платна и визуални решения в Банско.'),
  ('Bansko Collection', 'bansko-collection', 'Авторски продукти и сезонни колекции, вдъхновени от Банско и Пирин.', 'Bansko Collection | Bansko NOW', 'Тениски, чаши, постери, принтове и продукти с характер от Банско.'),
  ('Истории', 'stories', 'Хора, спомени, лични гледни точки и малки истории от Банско.', 'Истории от Банско | Bansko NOW', 'Местни истории, хора и гледни точки от Банско.')
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  seo_title = excluded.seo_title,
  seo_description = excluded.seo_description;

insert into public.site_settings (
  site_name,
  site_description,
  facebook_group_url,
  default_og_image,
  hero_media_type,
  hero_image_url,
  hero_image_alt,
  hero_video_poster_url,
  default_author_name
)
values (
  'Bansko NOW',
  'Събития, култура, природа, хора и истории от Банско и Пирин.',
  'https://www.facebook.com/groups/banskonow',
  'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?auto=format&fit=crop&w=1800&q=80',
  'image',
  'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?auto=format&fit=crop&w=1800&q=80',
  'Банско и Пирин',
  'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?auto=format&fit=crop&w=1800&q=80',
  'Любо Канелов'
)
on conflict do nothing;

insert into public.navigation_items (label, href, icon_name, sort_order, is_external, open_in_new_tab, is_active, aria_label)
values
  ('Сега', '/now', 'clock', 10, false, false, true, null),
  ('Събития', '/events', 'calendar-days', 20, false, false, true, null),
  ('Открий Банско', '/explore', 'compass', 30, false, false, true, null),
  ('Природа', '/nature', 'mountain', 40, false, false, true, null),
  ('Култура', '/culture', 'masks-theater', 50, false, false, true, null),
  ('Живот', '/living', 'users', 60, false, false, true, null),
  ('Храна', '/food', 'utensils', 70, false, false, true, null),
  ('Art Studio', '/art-studio', 'palette', 80, false, false, true, null),
  ('Bansko Collection', '/bansko-collection', 'bag-shopping', 90, false, false, true, null),
  ('Общност', '/#community', 'users', 100, false, false, true, null)
on conflict (href) do nothing;

insert into public.social_links (platform, label, url, icon_name, sort_order, is_active)
select 'facebook', 'Facebook група', facebook_group_url, 'facebook', 10, true
from public.site_settings
where facebook_group_url is not null and facebook_group_url <> ''
limit 1
on conflict (platform) do nothing;

insert into public.social_links (platform, label, url, icon_name, sort_order, is_active)
select 'instagram', 'Instagram', instagram_url, 'instagram', 20, true
from public.site_settings
where instagram_url is not null and instagram_url <> ''
limit 1
on conflict (platform) do nothing;

insert into public.social_links (platform, label, url, icon_name, sort_order, is_active)
select 'youtube', 'YouTube', youtube_url, 'youtube', 30, true
from public.site_settings
where youtube_url is not null and youtube_url <> ''
limit 1
on conflict (platform) do nothing;

insert into storage.buckets (id, name, public)
values ('bansko-media', 'bansko-media', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Bansko media is public" on storage.objects;
drop policy if exists "Admins can read Bansko media" on storage.objects;
create policy "Admins can read Bansko media"
on storage.objects
for select
to authenticated
using (bucket_id = 'bansko-media' and public.is_admin());

drop policy if exists "Admins can upload Bansko media" on storage.objects;
create policy "Admins can upload Bansko media"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'bansko-media' and public.is_admin());

drop policy if exists "Admins can update Bansko media" on storage.objects;
create policy "Admins can update Bansko media"
on storage.objects
for update
to authenticated
using (bucket_id = 'bansko-media' and public.is_admin())
with check (bucket_id = 'bansko-media' and public.is_admin());

drop policy if exists "Admins can delete Bansko media" on storage.objects;
create policy "Admins can delete Bansko media"
on storage.objects
for delete
to authenticated
using (bucket_id = 'bansko-media' and public.is_admin());
