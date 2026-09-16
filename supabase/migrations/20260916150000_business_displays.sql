-- Business Platform · стъпка 5: екрани (телевизорите в заведението).
-- Екранът не е второ меню: той казва само кои категории, кой шаблон и коя
-- снимка/видео отиват на кой телевизор. Телевизорът никога не говори със
-- Supabase - страницата /display/<token> го чете от сървъра през две функции
-- по token, така че никой не може да изброи чужди екрани.
-- Всичко е добавящо и идемпотентно. Документация: docs/business-platform.md §11.

create table if not exists public.business_displays (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  token text not null unique,
  template text not null default 'menu_only' check (template in ('menu_only', 'menu_image', 'menu_video')),
  theme text not null default 'dark' check (theme in ('dark', 'light')),
  media_id uuid references public.business_media(id) on delete set null,
  show_descriptions boolean not null default false,
  is_active boolean not null default true,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists business_displays_business_idx on public.business_displays (business_id, created_at);
create index if not exists business_displays_media_idx on public.business_displays (media_id);

drop trigger if exists set_business_displays_updated_at on public.business_displays;
create trigger set_business_displays_updated_at
  before update on public.business_displays
  for each row execute function public.set_updated_at();

-- Кои категории на менюто показва екранът (и в какъв ред). Носи business_id,
-- за да няма join в политиките и за тригера на версията.
create table if not exists public.business_display_categories (
  display_id uuid not null references public.business_displays(id) on delete cascade,
  category_id uuid not null references public.business_menu_categories(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  sort_order integer not null default 100,
  primary key (display_id, category_id)
);

create index if not exists business_display_categories_category_idx on public.business_display_categories (category_id);
create index if not exists business_display_categories_business_idx on public.business_display_categories (business_id);

-- Версия: телевизорът презарежда при смяна на шаблон/категории/медия, но
-- last_seen_at се пише при всяка проверка и не бива да вдига версията.
drop trigger if exists bump_content_version on public.business_displays;
create trigger bump_content_version
  after insert or delete or update of name, template, theme, media_id, show_descriptions, is_active
  on public.business_displays
  for each row execute function public.bump_business_content_version();

drop trigger if exists bump_content_version on public.business_display_categories;
create trigger bump_content_version
  after insert or update or delete on public.business_display_categories
  for each row execute function public.bump_business_content_version();

-- last_seen_at: set_updated_at не бива да мести updated_at при „видях те“,
-- иначе версията на страницата се сменя на всеки 30 s и екраните презареждат.
create or replace function public.keep_display_updated_at_on_heartbeat()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.last_seen_at is distinct from old.last_seen_at
     and new.name = old.name and new.template = old.template and new.theme = old.theme
     and new.media_id is not distinct from old.media_id
     and new.show_descriptions = old.show_descriptions and new.is_active = old.is_active then
    new.updated_at := old.updated_at;
  end if;
  return new;
end;
$$;

drop trigger if exists keep_display_updated_at_on_heartbeat on public.business_displays;
-- Име със „z“, за да се изпълни след set_business_displays_updated_at (по азбучен ред).
drop trigger if exists z_keep_display_updated_at_on_heartbeat on public.business_displays;
create trigger z_keep_display_updated_at_on_heartbeat
  before update on public.business_displays
  for each row execute function public.keep_display_updated_at_on_heartbeat();

-- ---------------------------------------------------------------------------
-- RLS: собственикът вижда и пише своите екрани; анонимен достъп до таблиците
-- няма изобщо - телевизорът минава през функциите по-долу.
-- ---------------------------------------------------------------------------
alter table public.business_displays enable row level security;
alter table public.business_display_categories enable row level security;

drop policy if exists "Members read displays" on public.business_displays;
create policy "Members read displays"
  on public.business_displays for select to authenticated
  using (business_id in (select public.member_business_ids()) or (select public.is_admin()));

drop policy if exists "Owners add displays" on public.business_displays;
create policy "Owners add displays"
  on public.business_displays for insert to authenticated
  with check ((select public.is_business_owner(business_id)) or (select public.is_admin()));

drop policy if exists "Owners update displays" on public.business_displays;
create policy "Owners update displays"
  on public.business_displays for update to authenticated
  using ((select public.is_business_owner(business_id)) or (select public.is_admin()))
  with check ((select public.is_business_owner(business_id)) or (select public.is_admin()));

drop policy if exists "Owners delete displays" on public.business_displays;
create policy "Owners delete displays"
  on public.business_displays for delete to authenticated
  using ((select public.is_business_owner(business_id)) or (select public.is_admin()));

drop policy if exists "Members read display categories" on public.business_display_categories;
create policy "Members read display categories"
  on public.business_display_categories for select to authenticated
  using (business_id in (select public.member_business_ids()) or (select public.is_admin()));

drop policy if exists "Owners add display categories" on public.business_display_categories;
create policy "Owners add display categories"
  on public.business_display_categories for insert to authenticated
  with check ((select public.is_business_owner(business_id)) or (select public.is_admin()));

drop policy if exists "Owners update display categories" on public.business_display_categories;
create policy "Owners update display categories"
  on public.business_display_categories for update to authenticated
  using ((select public.is_business_owner(business_id)) or (select public.is_admin()))
  with check ((select public.is_business_owner(business_id)) or (select public.is_admin()));

drop policy if exists "Owners delete display categories" on public.business_display_categories;
create policy "Owners delete display categories"
  on public.business_display_categories for delete to authenticated
  using ((select public.is_business_owner(business_id)) or (select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Функциите за телевизора. Отговарят само на точен token на активен екран на
-- активен бизнес с включен модул „екрани“; иначе null.
-- ---------------------------------------------------------------------------
create or replace function public.display_by_token(p_token text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id', d.id,
    'business_id', d.business_id,
    'business_name', b.name,
    'name', d.name,
    'template', d.template,
    'theme', d.theme,
    'show_descriptions', d.show_descriptions,
    'updated_at', d.updated_at,
    'content_version', s.content_version,
    'category_ids', coalesce((
      select jsonb_agg(dc.category_id order by dc.sort_order)
      from public.business_display_categories dc
      where dc.display_id = d.id
    ), '[]'::jsonb),
    'media', (
      select jsonb_build_object(
        'media_type', m.media_type,
        'original_key', m.original_key,
        'variant_keys', m.variant_keys,
        'alt', m.alt
      )
      from public.business_media m
      where m.id = d.media_id
    )
  )
  from public.business_displays d
  join public.businesses b on b.id = d.business_id
  join public.business_platform_settings s on s.business_id = d.business_id
  where d.token = p_token
    and d.is_active
    and length(p_token) between 16 and 64
    and d.business_id in (select public.public_business_ids('displays'))
  limit 1;
$$;

-- Версията е „content_version-updated_at“: хваща и промяна по самия екран.
-- Записва и „видях те“, най-много веднъж на минута, за таблото в портала.
create or replace function public.display_version(p_token text)
returns text
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_display public.business_displays%rowtype;
  v_version integer;
begin
  if p_token is null or length(p_token) < 16 or length(p_token) > 64 then
    return null;
  end if;

  select * into v_display
  from public.business_displays d
  where d.token = p_token
    and d.is_active
    and d.business_id in (select public.public_business_ids('displays'));

  if not found then
    return null;
  end if;

  select s.content_version into v_version
  from public.business_platform_settings s
  where s.business_id = v_display.business_id;

  if v_display.last_seen_at is null or v_display.last_seen_at < now() - interval '60 seconds' then
    update public.business_displays set last_seen_at = now() where id = v_display.id;
  end if;

  return v_version::text || '-' || extract(epoch from v_display.updated_at)::bigint::text;
end;
$$;

revoke execute on function public.display_by_token(text) from public;
revoke execute on function public.display_version(text) from public;
grant execute on function public.display_by_token(text) to anon, authenticated;
grant execute on function public.display_version(text) to anon, authenticated;
