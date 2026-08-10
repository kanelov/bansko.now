-- Bansko NOW bilingual content foundation.
-- Bulgarian remains the default locale and keeps its existing public URLs.

create extension if not exists "pgcrypto";

alter table public.articles
  add column if not exists locale text not null default 'bg',
  add column if not exists translation_group_id uuid not null default gen_random_uuid();

alter table public.articles
  drop constraint if exists articles_locale_check;
alter table public.articles
  add constraint articles_locale_check check (locale in ('bg', 'en'));

alter table public.articles drop constraint if exists articles_slug_key;
alter table public.articles drop constraint if exists articles_source_drive_id_key;

create unique index if not exists articles_locale_slug_unique_idx
  on public.articles (locale, slug);
create unique index if not exists articles_translation_locale_unique_idx
  on public.articles (translation_group_id, locale);
create unique index if not exists articles_source_drive_locale_unique_idx
  on public.articles (source_drive_id, locale)
  where source_drive_id is not null;
create index if not exists articles_locale_status_published_idx
  on public.articles (locale, status, published_at desc);
create index if not exists articles_translation_group_idx
  on public.articles (translation_group_id);

alter table public.editable_pages
  add column if not exists locale text not null default 'bg',
  add column if not exists translation_group_id uuid not null default gen_random_uuid();

alter table public.editable_pages
  drop constraint if exists editable_pages_locale_check;
alter table public.editable_pages
  add constraint editable_pages_locale_check check (locale in ('bg', 'en'));

alter table public.editable_pages drop constraint if exists editable_pages_slug_key;

create unique index if not exists editable_pages_locale_slug_unique_idx
  on public.editable_pages (locale, slug);
create unique index if not exists editable_pages_translation_locale_unique_idx
  on public.editable_pages (translation_group_id, locale);
create index if not exists editable_pages_locale_status_sort_idx
  on public.editable_pages (locale, status, sort_order);

alter table public.tags
  add column if not exists locale text not null default 'bg';

alter table public.tags
  drop constraint if exists tags_locale_check;
alter table public.tags
  add constraint tags_locale_check check (locale in ('bg', 'en'));

alter table public.tags drop constraint if exists tags_slug_key;
create unique index if not exists tags_locale_slug_unique_idx
  on public.tags (locale, slug);

create table if not exists public.category_translations (
  category_id uuid not null references public.categories(id) on delete cascade,
  locale text not null check (locale in ('bg', 'en')),
  name text not null,
  description text,
  seo_title text,
  seo_description text,
  canonical_url text,
  og_title text,
  og_description text,
  og_image_url text,
  robots_index boolean not null default true,
  robots_follow boolean not null default true,
  schema_type text default 'CollectionPage',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (category_id, locale)
);

create table if not exists public.navigation_item_translations (
  navigation_item_id uuid not null references public.navigation_items(id) on delete cascade,
  locale text not null check (locale in ('bg', 'en')),
  label text not null,
  aria_label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (navigation_item_id, locale)
);

create table if not exists public.site_settings_translations (
  site_settings_id uuid not null references public.site_settings(id) on delete cascade,
  locale text not null check (locale in ('bg', 'en')),
  site_description text,
  hero_image_alt text,
  support_button_label text,
  support_title text,
  support_description text,
  support_image_alt text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (site_settings_id, locale)
);

create table if not exists public.art_studio_service_translations (
  service_id uuid not null references public.art_studio_services(id) on delete cascade,
  locale text not null check (locale in ('bg', 'en')),
  title text not null,
  description text,
  image_alt text,
  button_label text,
  price_label text,
  features text[] not null default '{}',
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (service_id, locale)
);

create table if not exists public.business_translations (
  business_id uuid not null references public.businesses(id) on delete cascade,
  locale text not null check (locale in ('bg', 'en')),
  slug text not null,
  name text not null,
  category text not null,
  description text,
  address text not null,
  image_alt text,
  faqs jsonb not null default '[]'::jsonb,
  features text[] not null default '{}',
  seo_title text,
  seo_description text,
  canonical_url text,
  og_title text,
  og_description text,
  og_image_url text,
  robots_index boolean not null default true,
  robots_follow boolean not null default true,
  schema_type text default 'LocalBusiness',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (business_id, locale)
);

create unique index if not exists business_translations_locale_slug_unique_idx
  on public.business_translations (locale, slug);
create index if not exists business_translations_locale_category_idx
  on public.business_translations (locale, category);

create table if not exists public.media_translations (
  media_id uuid not null references public.media(id) on delete cascade,
  locale text not null check (locale in ('bg', 'en')),
  alt_text text,
  caption text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (media_id, locale)
);

drop trigger if exists category_translations_set_updated_at on public.category_translations;
create trigger category_translations_set_updated_at
before update on public.category_translations
for each row execute function public.set_updated_at();

drop trigger if exists navigation_item_translations_set_updated_at on public.navigation_item_translations;
create trigger navigation_item_translations_set_updated_at
before update on public.navigation_item_translations
for each row execute function public.set_updated_at();

drop trigger if exists site_settings_translations_set_updated_at on public.site_settings_translations;
create trigger site_settings_translations_set_updated_at
before update on public.site_settings_translations
for each row execute function public.set_updated_at();

drop trigger if exists art_studio_service_translations_set_updated_at on public.art_studio_service_translations;
create trigger art_studio_service_translations_set_updated_at
before update on public.art_studio_service_translations
for each row execute function public.set_updated_at();

drop trigger if exists business_translations_set_updated_at on public.business_translations;
create trigger business_translations_set_updated_at
before update on public.business_translations
for each row execute function public.set_updated_at();

drop trigger if exists media_translations_set_updated_at on public.media_translations;
create trigger media_translations_set_updated_at
before update on public.media_translations
for each row execute function public.set_updated_at();

alter table public.category_translations enable row level security;
alter table public.navigation_item_translations enable row level security;
alter table public.site_settings_translations enable row level security;
alter table public.art_studio_service_translations enable row level security;
alter table public.business_translations enable row level security;
alter table public.media_translations enable row level security;

grant select on public.category_translations to anon;
grant select on public.navigation_item_translations to anon;
grant select on public.site_settings_translations to anon;
grant select on public.art_studio_service_translations to anon;
grant select on public.business_translations to anon;
grant select on public.media_translations to anon;

grant select, insert, update, delete on public.category_translations to authenticated;
grant select, insert, update, delete on public.navigation_item_translations to authenticated;
grant select, insert, update, delete on public.site_settings_translations to authenticated;
grant select, insert, update, delete on public.art_studio_service_translations to authenticated;
grant select, insert, update, delete on public.business_translations to authenticated;
grant select, insert, update, delete on public.media_translations to authenticated;

drop policy if exists "Category translations are public" on public.category_translations;
create policy "Category translations are public"
on public.category_translations for select to anon using (true);
drop policy if exists "Admins manage category translations" on public.category_translations;
create policy "Admins manage category translations"
on public.category_translations for all to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Navigation translations are public" on public.navigation_item_translations;
create policy "Navigation translations are public"
on public.navigation_item_translations for select to anon using (true);
drop policy if exists "Admins manage navigation translations" on public.navigation_item_translations;
create policy "Admins manage navigation translations"
on public.navigation_item_translations for all to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Settings translations are public" on public.site_settings_translations;
create policy "Settings translations are public"
on public.site_settings_translations for select to anon using (true);
drop policy if exists "Admins manage settings translations" on public.site_settings_translations;
create policy "Admins manage settings translations"
on public.site_settings_translations for all to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Active service translations are public" on public.art_studio_service_translations;
create policy "Active service translations are public"
on public.art_studio_service_translations for select to anon
using (exists (
  select 1 from public.art_studio_services service
  where service.id = service_id and service.is_active = true
));
drop policy if exists "Admins manage service translations" on public.art_studio_service_translations;
create policy "Admins manage service translations"
on public.art_studio_service_translations for all to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Approved business translations are public" on public.business_translations;
create policy "Approved business translations are public"
on public.business_translations for select to anon
using (exists (
  select 1 from public.businesses business
  where business.id = business_id and business.status = 'approved'
));
drop policy if exists "Admins manage business translations" on public.business_translations;
create policy "Admins manage business translations"
on public.business_translations for all to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Media translations are public" on public.media_translations;
create policy "Media translations are public"
on public.media_translations for select to anon using (true);
drop policy if exists "Admins manage media translations" on public.media_translations;
create policy "Admins manage media translations"
on public.media_translations for all to authenticated
using (public.is_admin()) with check (public.is_admin());

insert into public.category_translations (
  category_id, locale, name, description, seo_title, seo_description,
  canonical_url, og_title, og_description, og_image_url,
  robots_index, robots_follow, schema_type
)
select
  id, 'bg', name, description, seo_title, seo_description,
  canonical_url, og_title, og_description, og_image_url,
  coalesce(robots_index, true), coalesce(robots_follow, true), schema_type
from public.categories
on conflict (category_id, locale) do nothing;

insert into public.category_translations (
  category_id, locale, name, description, seo_title, seo_description,
  robots_index, robots_follow, schema_type
)
select
  id,
  'en',
  case slug
    when 'now' then 'Now'
    when 'events' then 'Events'
    when 'explore' then 'Explore Bansko'
    when 'nature' then 'Nature and Pirin'
    when 'culture' then 'Culture'
    when 'living' then 'Living in Bansko'
    when 'food' then 'Food and Places'
    when 'art-studio' then 'Art Studio'
    when 'bansko-collection' then 'Bansko Collection'
    when 'stories' then 'Stories'
    else name
  end,
  case slug
    when 'now' then 'What is happening in Bansko today: useful updates, local ideas and timely stories.'
    when 'events' then 'Festivals, concerts, exhibitions and local initiatives in Bansko and the region.'
    when 'explore' then 'Places, routes and practical ideas for discovering Bansko.'
    when 'nature' then 'Pirin Mountain, trails, seasons and responsible time outdoors.'
    when 'culture' then 'Traditions, art, music and cultural life in Bansko.'
    when 'living' then 'Everyday life, people and practical stories from Bansko.'
    when 'food' then 'Local food, restaurants and places worth discovering.'
    when 'art-studio' then 'Photography, fine art printing and visual services from Bansko NOW.'
    when 'bansko-collection' then 'Artistic products inspired by Bansko and Pirin.'
    when 'stories' then 'People, places and visual stories from Bansko.'
    else null
  end,
  case slug
    when 'events' then 'Events in Bansko'
    when 'nature' then 'Nature and Pirin Mountain'
    else null
  end,
  case slug
    when 'events' then 'Discover festivals, concerts, exhibitions and events in Bansko.'
    when 'nature' then 'Trails, landscapes and seasonal ideas from Pirin Mountain.'
    else null
  end,
  true,
  true,
  coalesce(schema_type, 'CollectionPage')
from public.categories
on conflict (category_id, locale) do nothing;

insert into public.navigation_item_translations (navigation_item_id, locale, label, aria_label)
select id, 'bg', label, aria_label
from public.navigation_items
on conflict (navigation_item_id, locale) do nothing;

insert into public.navigation_item_translations (navigation_item_id, locale, label, aria_label)
select
  id,
  'en',
  case
    when href = '/now' then 'Now'
    when href = '/events' then 'Events'
    when href = '/explore' then 'Explore'
    when href = '/nature' then 'Nature'
    when href = '/culture' then 'Culture'
    when href = '/living' then 'Living'
    when href = '/food' then 'Food'
    when href = '/art-studio' then 'Art Studio'
    when href = '/bansko-collection' then 'Bansko Collection'
    when href = '/businesses' then 'Local Businesses'
    else label
  end,
  case
    when href = '/' then 'Bansko NOW home'
    else null
  end
from public.navigation_items
on conflict (navigation_item_id, locale) do nothing;

insert into public.site_settings_translations (
  site_settings_id, locale, site_description, hero_image_alt,
  support_button_label, support_title, support_description, support_image_alt
)
select
  id, 'bg', site_description, hero_image_alt,
  support_button_label, support_title, support_description, support_image_alt
from public.site_settings
on conflict (site_settings_id, locale) do nothing;

insert into public.site_settings_translations (
  site_settings_id, locale, site_description, hero_image_alt,
  support_button_label, support_title, support_description, support_image_alt
)
select
  id,
  'en',
  'Events, culture, nature, people and stories from Bansko and Pirin.',
  'Bansko and Pirin Mountain',
  'Support us',
  'Support Bansko NOW',
  'If Bansko NOW is useful to you, you can support independent local stories, photography and ideas with an amount of your choice.',
  'Bansko and Pirin - the inspiration behind Bansko NOW'
from public.site_settings
on conflict (site_settings_id, locale) do nothing;

insert into public.art_studio_service_translations (
  service_id, locale, title, description, image_alt, button_label,
  price_label, features, seo_title, seo_description
)
select
  id, 'bg', title, description, image_alt, button_label,
  price_label, coalesce(features, '{}'), seo_title, seo_description
from public.art_studio_services
on conflict (service_id, locale) do nothing;

insert into public.art_studio_service_translations (
  service_id, locale, title, description, image_alt, button_label,
  price_label, features, seo_title, seo_description
)
select
  id,
  'en',
  case slug
    when 'fine-art-print' then 'Fine Art Printing'
    when 'canvas-print' then 'Canvas Printing'
    when 'teniski-print' then 'T-shirt Printing'
    else title
  end,
  case slug
    when 'fine-art-print' then 'Premium printing on fine art paper for photography, exhibitions and personal projects.'
    when 'canvas-print' then 'Canvas prints with a distinctive visual character for homes, studios, hotels, restaurants or a gift from Bansko.'
    when 'teniski-print' then 'Custom printing on quality cotton T-shirts in Bansko.'
    else null
  end,
  case slug
    when 'fine-art-print' then 'Fine art photography printing'
    when 'canvas-print' then 'Custom canvas printing'
    when 'teniski-print' then 'Custom T-shirt printing'
    else title
  end,
  case slug
    when 'fine-art-print' then 'Ask about printing'
    when 'canvas-print' then 'View options'
    when 'teniski-print' then 'Discuss a project'
    else 'Learn more'
  end,
  case slug
    when 'fine-art-print' then 'on request'
    when 'canvas-print' then 'custom sizes'
    when 'teniski-print' then 'custom quote'
    else null
  end,
  case slug
    when 'fine-art-print' then array['Fine art papers', 'Colour preparation', 'Gallery-quality finish']
    when 'canvas-print' then array['Canvas', 'Ready to hang', 'Photography from Bansko']
    when 'teniski-print' then array['Photography', 'Design', 'Local character']
    else '{}'
  end,
  case slug
    when 'fine-art-print' then 'Fine Art Printing in Bansko'
    when 'canvas-print' then 'Canvas Printing in Bansko'
    when 'teniski-print' then 'Custom T-shirt Printing in Bansko'
    else title
  end,
  case slug
    when 'fine-art-print' then 'Fine art photo printing and professional print preparation by Bansko NOW Art Studio.'
    when 'canvas-print' then 'Custom canvas prints inspired by Bansko and Pirin Mountain.'
    when 'teniski-print' then 'Custom T-shirt printing and visual design in Bansko.'
    else null
  end
from public.art_studio_services
on conflict (service_id, locale) do nothing;

insert into public.business_translations (
  business_id, locale, slug, name, category, description, address,
  faqs, features, seo_title, seo_description, canonical_url,
  og_title, og_description, og_image_url, robots_index, robots_follow, schema_type
)
select
  id, 'bg', slug, name, category, description, address,
  coalesce(faqs, '[]'::jsonb), coalesce(features, '{}'), seo_title, seo_description, canonical_url,
  og_title, og_description, og_image_url, coalesce(robots_index, true), coalesce(robots_follow, true), schema_type
from public.businesses
on conflict (business_id, locale) do nothing;

insert into public.media_translations (media_id, locale, alt_text, caption)
select id, 'bg', alt_text, caption
from public.media
on conflict (media_id, locale) do nothing;

insert into public.editable_pages (
  title, slug, eyebrow, excerpt, content, hero_image_url, hero_image_alt,
  cta_label, cta_url, status, seo_title, seo_description, canonical_url,
  og_title, og_description, og_image_url, robots_index, robots_follow,
  schema_type, sort_order, locale, translation_group_id
)
select
  case source.slug
    when 'about' then 'Bansko NOW'
    when 'contact' then 'Contact Bansko NOW'
    when 'art-studio' then 'Bansko NOW Art Studio'
  end,
  source.slug,
  case source.slug
    when 'about' then 'About the project'
    when 'contact' then 'Contact'
    when 'art-studio' then 'Visual stories from Bansko'
  end,
  case source.slug
    when 'about' then 'A local digital platform for events, culture, nature, people and everyday life in Bansko.'
    when 'contact' then 'Contact us about events, recommendations, Art Studio services, businesses and partnerships.'
    when 'art-studio' then 'Photography, fine art printing, canvas, visual solutions and original products inspired by Bansko and Pirin.'
  end,
  case source.slug
    when 'about' then E'Bansko NOW is a fast, beautiful and useful place for discovering Bansko.\n\nWe publish articles, local recommendations, visual stories, businesses and seasonal ideas that bring people closer to the town.'
    when 'contact' then ''
    when 'art-studio' then 'Beautiful places, events and personal memories deserve a strong visual presence. Bansko NOW Art Studio creates fine art prints, photography, canvas and visual solutions with a premium finish.'
  end,
  source.hero_image_url,
  case source.slug
    when 'about' then 'Bansko NOW local lifestyle platform'
    when 'contact' then 'Contact Bansko NOW'
    when 'art-studio' then 'Photography and printing at Bansko NOW Art Studio'
  end,
  case source.slug
    when 'art-studio' then 'Discuss a project'
    else null
  end,
  case source.slug
    when 'art-studio' then '/contact'
    else source.cta_url
  end,
  source.status,
  case source.slug
    when 'about' then 'About Bansko NOW'
    when 'contact' then 'Contact Bansko NOW'
    when 'art-studio' then 'Art Studio in Bansko'
  end,
  case source.slug
    when 'about' then 'Learn about Bansko NOW, a local lifestyle, culture and nature platform for Bansko and Pirin.'
    when 'contact' then 'Contact Bansko NOW about events, local stories, visual projects and partnerships.'
    when 'art-studio' then 'Fine art printing, photography, canvas and visual solutions inspired by Bansko and Pirin.'
  end,
  null,
  null,
  null,
  source.og_image_url,
  source.robots_index,
  source.robots_follow,
  source.schema_type,
  source.sort_order,
  'en',
  source.translation_group_id
from public.editable_pages source
where source.locale = 'bg'
  and source.slug in ('about', 'contact', 'art-studio')
on conflict (translation_group_id, locale) do nothing;
