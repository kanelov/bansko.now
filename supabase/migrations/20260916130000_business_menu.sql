-- Business Platform · стъпка 3: медия на бизнеса и меню (категории, артикули,
-- варианти, преводи). Едно меню, показвано на четири места; тук живее истината.
-- Всичко е добавящо и идемпотентно. Документация: docs/business-platform.md.

-- ---------------------------------------------------------------------------
-- 0. Помощна: активните бизнеси без условие за модул (медия, профил)
-- ---------------------------------------------------------------------------
create or replace function public.active_business_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select b.id
  from public.businesses b
  join public.business_platform_settings s on s.business_id = b.id and s.platform_status = 'active'
  where b.status = 'approved';
$$;

grant execute on function public.active_business_ids() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 1. Медия: снимки (оригинал + три WebP размера) и видео (MP4) на R2
--    под business/<business_id>/{original,image,video}/…
-- ---------------------------------------------------------------------------
create table if not exists public.business_media (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  media_type text not null check (media_type in ('image', 'video')),
  kind text not null check (kind in ('cover', 'gallery', 'item', 'display', 'print_background', 'logo')),
  original_key text not null,
  variant_keys jsonb not null default '{}'::jsonb,
  mime_type text not null,
  bytes integer,
  width integer,
  height integer,
  duration_seconds numeric(8, 2),
  alt text,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists business_media_business_kind_idx
  on public.business_media (business_id, kind, sort_order);

drop trigger if exists set_business_media_updated_at on public.business_media;
create trigger set_business_media_updated_at
  before update on public.business_media
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 2. Категории на менюто
-- ---------------------------------------------------------------------------
create table if not exists public.business_menu_categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  sort_order integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists business_menu_categories_business_order_idx
  on public.business_menu_categories (business_id, sort_order);

drop trigger if exists set_business_menu_categories_updated_at on public.business_menu_categories;
create trigger set_business_menu_categories_updated_at
  before update on public.business_menu_categories
  for each row execute function public.set_updated_at();

-- Преводите носят и business_id: политиките не правят join, а тригерът за
-- версията знае за кой бизнес е промяната.
create table if not exists public.business_menu_category_translations (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.business_menu_categories(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  locale text not null check (locale in ('bg', 'en')),
  name text not null,
  description text,
  unique (category_id, locale)
);

create index if not exists business_menu_category_translations_business_idx
  on public.business_menu_category_translations (business_id);

-- ---------------------------------------------------------------------------
-- 3. Артикули: цената е в евроцентове. Артикул с варианти има price_cents null
--    (правилото се пази от тригер по-долу).
-- ---------------------------------------------------------------------------
create table if not exists public.business_menu_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  category_id uuid not null references public.business_menu_categories(id) on delete cascade,
  price_cents integer check (price_cents is null or price_cents >= 0),
  availability text not null default 'available' check (availability in ('available', 'sold_out')),
  is_active boolean not null default true,
  sort_order integer not null default 100,
  media_id uuid references public.business_media(id) on delete set null,
  tags text[] not null default '{}'::text[],
  allergens text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists business_menu_items_business_category_order_idx
  on public.business_menu_items (business_id, category_id, sort_order);
create index if not exists business_menu_items_media_idx on public.business_menu_items (media_id);

drop trigger if exists set_business_menu_items_updated_at on public.business_menu_items;
create trigger set_business_menu_items_updated_at
  before update on public.business_menu_items
  for each row execute function public.set_updated_at();

create table if not exists public.business_menu_item_translations (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.business_menu_items(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  locale text not null check (locale in ('bg', 'en')),
  name text not null,
  description text,
  unique (item_id, locale)
);

create index if not exists business_menu_item_translations_business_idx
  on public.business_menu_item_translations (business_id);

-- ---------------------------------------------------------------------------
-- 4. Варианти (малко / голямо): всеки със своя цена и BG/EN име
-- ---------------------------------------------------------------------------
create table if not exists public.business_menu_item_variants (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.business_menu_items(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  price_cents integer not null check (price_cents >= 0),
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists business_menu_item_variants_item_order_idx
  on public.business_menu_item_variants (item_id, sort_order);
create index if not exists business_menu_item_variants_business_idx
  on public.business_menu_item_variants (business_id);

drop trigger if exists set_business_menu_item_variants_updated_at on public.business_menu_item_variants;
create trigger set_business_menu_item_variants_updated_at
  before update on public.business_menu_item_variants
  for each row execute function public.set_updated_at();

create table if not exists public.business_menu_item_variant_translations (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.business_menu_item_variants(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  locale text not null check (locale in ('bg', 'en')),
  name text not null,
  unique (variant_id, locale)
);

create index if not exists business_menu_item_variant_translations_business_idx
  on public.business_menu_item_variant_translations (business_id);

-- ---------------------------------------------------------------------------
-- 5. Правилото за цената: никога и двете
-- ---------------------------------------------------------------------------
create or replace function public.enforce_menu_item_price_rule()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.price_cents is not null
     and exists (select 1 from public.business_menu_item_variants v where v.item_id = new.id) then
    raise exception 'Артикул с варианти няма собствена цена' using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_menu_item_price_rule on public.business_menu_items;
create trigger enforce_menu_item_price_rule
  before insert or update on public.business_menu_items
  for each row execute function public.enforce_menu_item_price_rule();

create or replace function public.clear_menu_item_price_on_variant()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.business_menu_items
  set price_cents = null
  where id = new.item_id and price_cents is not null;
  return null;
end;
$$;

revoke execute on function public.clear_menu_item_price_on_variant() from public, anon, authenticated;

drop trigger if exists clear_menu_item_price_on_variant on public.business_menu_item_variants;
create trigger clear_menu_item_price_on_variant
  after insert on public.business_menu_item_variants
  for each row execute function public.clear_menu_item_price_on_variant();

-- ---------------------------------------------------------------------------
-- 6. Версия на съдържанието: всяка промяна тук стига до телевизорите
-- ---------------------------------------------------------------------------
drop trigger if exists bump_content_version on public.business_media;
create trigger bump_content_version
  after insert or update or delete on public.business_media
  for each row execute function public.bump_business_content_version();

drop trigger if exists bump_content_version on public.business_menu_categories;
create trigger bump_content_version
  after insert or update or delete on public.business_menu_categories
  for each row execute function public.bump_business_content_version();

drop trigger if exists bump_content_version on public.business_menu_category_translations;
create trigger bump_content_version
  after insert or update or delete on public.business_menu_category_translations
  for each row execute function public.bump_business_content_version();

drop trigger if exists bump_content_version on public.business_menu_items;
create trigger bump_content_version
  after insert or update or delete on public.business_menu_items
  for each row execute function public.bump_business_content_version();

drop trigger if exists bump_content_version on public.business_menu_item_translations;
create trigger bump_content_version
  after insert or update or delete on public.business_menu_item_translations
  for each row execute function public.bump_business_content_version();

drop trigger if exists bump_content_version on public.business_menu_item_variants;
create trigger bump_content_version
  after insert or update or delete on public.business_menu_item_variants
  for each row execute function public.bump_business_content_version();

drop trigger if exists bump_content_version on public.business_menu_item_variant_translations;
create trigger bump_content_version
  after insert or update or delete on public.business_menu_item_variant_translations
  for each row execute function public.bump_business_content_version();

-- ---------------------------------------------------------------------------
-- 7. RLS: една политика на действие. Публично четене само на активното от
--    бизнеси с включен модул „меню“; собственикът вижда и пише своето; админът - всичко.
-- ---------------------------------------------------------------------------
alter table public.business_media enable row level security;
alter table public.business_menu_categories enable row level security;
alter table public.business_menu_category_translations enable row level security;
alter table public.business_menu_items enable row level security;
alter table public.business_menu_item_translations enable row level security;
alter table public.business_menu_item_variants enable row level security;
alter table public.business_menu_item_variant_translations enable row level security;

-- business_media
drop policy if exists "Business media is readable" on public.business_media;
create policy "Business media is readable"
  on public.business_media for select to anon, authenticated
  using (
    business_id in (select public.active_business_ids())
    or business_id in (select public.member_business_ids())
    or (select public.is_admin())
  );

drop policy if exists "Owners add business media" on public.business_media;
create policy "Owners add business media"
  on public.business_media for insert to authenticated
  with check ((select public.is_business_owner(business_id)) or (select public.is_admin()));

drop policy if exists "Owners update business media" on public.business_media;
create policy "Owners update business media"
  on public.business_media for update to authenticated
  using ((select public.is_business_owner(business_id)) or (select public.is_admin()))
  with check ((select public.is_business_owner(business_id)) or (select public.is_admin()));

drop policy if exists "Owners delete business media" on public.business_media;
create policy "Owners delete business media"
  on public.business_media for delete to authenticated
  using ((select public.is_business_owner(business_id)) or (select public.is_admin()));

-- business_menu_categories
drop policy if exists "Menu categories are readable" on public.business_menu_categories;
create policy "Menu categories are readable"
  on public.business_menu_categories for select to anon, authenticated
  using (
    (is_active and business_id in (select public.public_business_ids('menu')))
    or business_id in (select public.member_business_ids())
    or (select public.is_admin())
  );

drop policy if exists "Owners add menu categories" on public.business_menu_categories;
create policy "Owners add menu categories"
  on public.business_menu_categories for insert to authenticated
  with check ((select public.is_business_owner(business_id)) or (select public.is_admin()));

drop policy if exists "Owners update menu categories" on public.business_menu_categories;
create policy "Owners update menu categories"
  on public.business_menu_categories for update to authenticated
  using ((select public.is_business_owner(business_id)) or (select public.is_admin()))
  with check ((select public.is_business_owner(business_id)) or (select public.is_admin()));

drop policy if exists "Owners delete menu categories" on public.business_menu_categories;
create policy "Owners delete menu categories"
  on public.business_menu_categories for delete to authenticated
  using ((select public.is_business_owner(business_id)) or (select public.is_admin()));

-- business_menu_category_translations
drop policy if exists "Menu category translations are readable" on public.business_menu_category_translations;
create policy "Menu category translations are readable"
  on public.business_menu_category_translations for select to anon, authenticated
  using (
    (
      business_id in (select public.public_business_ids('menu'))
      and exists (select 1 from public.business_menu_categories c where c.id = category_id and c.is_active)
    )
    or business_id in (select public.member_business_ids())
    or (select public.is_admin())
  );

drop policy if exists "Owners add menu category translations" on public.business_menu_category_translations;
create policy "Owners add menu category translations"
  on public.business_menu_category_translations for insert to authenticated
  with check ((select public.is_business_owner(business_id)) or (select public.is_admin()));

drop policy if exists "Owners update menu category translations" on public.business_menu_category_translations;
create policy "Owners update menu category translations"
  on public.business_menu_category_translations for update to authenticated
  using ((select public.is_business_owner(business_id)) or (select public.is_admin()))
  with check ((select public.is_business_owner(business_id)) or (select public.is_admin()));

drop policy if exists "Owners delete menu category translations" on public.business_menu_category_translations;
create policy "Owners delete menu category translations"
  on public.business_menu_category_translations for delete to authenticated
  using ((select public.is_business_owner(business_id)) or (select public.is_admin()));

-- business_menu_items
drop policy if exists "Menu items are readable" on public.business_menu_items;
create policy "Menu items are readable"
  on public.business_menu_items for select to anon, authenticated
  using (
    (is_active and business_id in (select public.public_business_ids('menu')))
    or business_id in (select public.member_business_ids())
    or (select public.is_admin())
  );

drop policy if exists "Owners add menu items" on public.business_menu_items;
create policy "Owners add menu items"
  on public.business_menu_items for insert to authenticated
  with check ((select public.is_business_owner(business_id)) or (select public.is_admin()));

drop policy if exists "Owners update menu items" on public.business_menu_items;
create policy "Owners update menu items"
  on public.business_menu_items for update to authenticated
  using ((select public.is_business_owner(business_id)) or (select public.is_admin()))
  with check ((select public.is_business_owner(business_id)) or (select public.is_admin()));

drop policy if exists "Owners delete menu items" on public.business_menu_items;
create policy "Owners delete menu items"
  on public.business_menu_items for delete to authenticated
  using ((select public.is_business_owner(business_id)) or (select public.is_admin()));

-- business_menu_item_translations
drop policy if exists "Menu item translations are readable" on public.business_menu_item_translations;
create policy "Menu item translations are readable"
  on public.business_menu_item_translations for select to anon, authenticated
  using (
    (
      business_id in (select public.public_business_ids('menu'))
      and exists (select 1 from public.business_menu_items i where i.id = item_id and i.is_active)
    )
    or business_id in (select public.member_business_ids())
    or (select public.is_admin())
  );

drop policy if exists "Owners add menu item translations" on public.business_menu_item_translations;
create policy "Owners add menu item translations"
  on public.business_menu_item_translations for insert to authenticated
  with check ((select public.is_business_owner(business_id)) or (select public.is_admin()));

drop policy if exists "Owners update menu item translations" on public.business_menu_item_translations;
create policy "Owners update menu item translations"
  on public.business_menu_item_translations for update to authenticated
  using ((select public.is_business_owner(business_id)) or (select public.is_admin()))
  with check ((select public.is_business_owner(business_id)) or (select public.is_admin()));

drop policy if exists "Owners delete menu item translations" on public.business_menu_item_translations;
create policy "Owners delete menu item translations"
  on public.business_menu_item_translations for delete to authenticated
  using ((select public.is_business_owner(business_id)) or (select public.is_admin()));

-- business_menu_item_variants
drop policy if exists "Menu item variants are readable" on public.business_menu_item_variants;
create policy "Menu item variants are readable"
  on public.business_menu_item_variants for select to anon, authenticated
  using (
    (
      is_active
      and business_id in (select public.public_business_ids('menu'))
      and exists (select 1 from public.business_menu_items i where i.id = item_id and i.is_active)
    )
    or business_id in (select public.member_business_ids())
    or (select public.is_admin())
  );

drop policy if exists "Owners add menu item variants" on public.business_menu_item_variants;
create policy "Owners add menu item variants"
  on public.business_menu_item_variants for insert to authenticated
  with check ((select public.is_business_owner(business_id)) or (select public.is_admin()));

drop policy if exists "Owners update menu item variants" on public.business_menu_item_variants;
create policy "Owners update menu item variants"
  on public.business_menu_item_variants for update to authenticated
  using ((select public.is_business_owner(business_id)) or (select public.is_admin()))
  with check ((select public.is_business_owner(business_id)) or (select public.is_admin()));

drop policy if exists "Owners delete menu item variants" on public.business_menu_item_variants;
create policy "Owners delete menu item variants"
  on public.business_menu_item_variants for delete to authenticated
  using ((select public.is_business_owner(business_id)) or (select public.is_admin()));

-- business_menu_item_variant_translations
drop policy if exists "Menu item variant translations are readable" on public.business_menu_item_variant_translations;
create policy "Menu item variant translations are readable"
  on public.business_menu_item_variant_translations for select to anon, authenticated
  using (
    (
      business_id in (select public.public_business_ids('menu'))
      and exists (
        select 1
        from public.business_menu_item_variants v
        join public.business_menu_items i on i.id = v.item_id
        where v.id = variant_id and v.is_active and i.is_active
      )
    )
    or business_id in (select public.member_business_ids())
    or (select public.is_admin())
  );

drop policy if exists "Owners add menu item variant translations" on public.business_menu_item_variant_translations;
create policy "Owners add menu item variant translations"
  on public.business_menu_item_variant_translations for insert to authenticated
  with check ((select public.is_business_owner(business_id)) or (select public.is_admin()));

drop policy if exists "Owners update menu item variant translations" on public.business_menu_item_variant_translations;
create policy "Owners update menu item variant translations"
  on public.business_menu_item_variant_translations for update to authenticated
  using ((select public.is_business_owner(business_id)) or (select public.is_admin()))
  with check ((select public.is_business_owner(business_id)) or (select public.is_admin()));

drop policy if exists "Owners delete menu item variant translations" on public.business_menu_item_variant_translations;
create policy "Owners delete menu item variant translations"
  on public.business_menu_item_variant_translations for delete to authenticated
  using ((select public.is_business_owner(business_id)) or (select public.is_admin()));
