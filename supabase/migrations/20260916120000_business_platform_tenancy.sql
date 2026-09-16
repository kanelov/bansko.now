-- Business Platform · стъпка 1: tenant модел, права, настройки на платформата и модули.
-- Всичко е добавящо и идемпотентно; съществуващи редове не се пипат.
-- Прилага се през Supabase MCP `apply_migration` със същото име като файла.
-- Документация: docs/business-platform.md, CLAUDE.md раздел 28.

-- ---------------------------------------------------------------------------
-- 1. Кой потребител е собственик на кой бизнес
-- ---------------------------------------------------------------------------
create table if not exists public.business_members (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'staff')),
  invited_email text,
  invited_by uuid references auth.users(id) on delete set null,
  invited_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_members_identity_check check (user_id is not null or invited_email is not null)
);

create unique index if not exists business_members_business_user_key
  on public.business_members (business_id, user_id)
  where user_id is not null;

create unique index if not exists business_members_business_invited_email_key
  on public.business_members (business_id, lower(invited_email))
  where invited_email is not null;

create index if not exists business_members_user_id_idx on public.business_members (user_id);

drop trigger if exists set_business_members_updated_at on public.business_members;
create trigger set_business_members_updated_at
  before update on public.business_members
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 2. Настройки на платформата: един ред на бизнес, създава се при активиране.
--    Админът пише platform_status и plan; собственикът - само open_override;
--    content_version се вдига от тригери и го гледат телевизорите.
-- ---------------------------------------------------------------------------
create table if not exists public.business_platform_settings (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  platform_status text not null default 'listing'
    check (platform_status in ('listing', 'active', 'suspended')),
  plan text not null default 'free',
  open_override text not null default 'auto'
    check (open_override in ('auto', 'open', 'closed')),
  content_version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_business_platform_settings_updated_at on public.business_platform_settings;
create trigger set_business_platform_settings_updated_at
  before update on public.business_platform_settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 3. Модули: по един ред на бизнес и модул. Включва ги админът (част от плана);
--    собственикът пипа само settings на включен модул.
-- ---------------------------------------------------------------------------
create table if not exists public.business_modules (
  business_id uuid not null references public.businesses(id) on delete cascade,
  module text not null
    check (module in ('menu', 'hours', 'displays', 'print', 'promotions', 'analytics', 'custom_domain')),
  enabled boolean not null default false,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (business_id, module)
);

drop trigger if exists set_business_modules_updated_at on public.business_modules;
create trigger set_business_modules_updated_at
  before update on public.business_modules
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 4. Помощни функции за политиките
-- ---------------------------------------------------------------------------
-- Бизнесите, в които текущият потребител е член.
create or replace function public.member_business_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select business_id
  from public.business_members
  where user_id = auth.uid();
$$;

-- Ролята на текущия потребител в даден бизнес (null, ако не е член).
create or replace function public.business_role(p_business_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.business_members
  where user_id = auth.uid() and business_id = p_business_id
  limit 1;
$$;

create or replace function public.is_business_owner(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.business_members
    where user_id = auth.uid() and business_id = p_business_id and role = 'owner'
  );
$$;

-- Сесии, които могат да пипат административни полета: админ в JWT,
-- service role (сървър към сървър) или директна работа в базата.
create or replace function public.is_privileged_session()
returns boolean
language sql
stable
set search_path = public
as $$
  select (select public.is_admin())
    or coalesce(auth.role(), '') = 'service_role'
    or current_user in ('service_role', 'postgres', 'supabase_admin');
$$;

-- Бизнесите, чиито данни от даден модул са публични: одобрен каталог,
-- активна платформа и включен модул. Изключен модул = невидими данни.
create or replace function public.public_business_ids(p_module text)
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select b.id
  from public.businesses b
  join public.business_platform_settings s on s.business_id = b.id and s.platform_status = 'active'
  join public.business_modules m on m.business_id = b.id and m.module = p_module and m.enabled
  where b.status = 'approved';
$$;

grant execute on function public.member_business_ids() to anon, authenticated;
grant execute on function public.business_role(uuid) to anon, authenticated;
grant execute on function public.is_business_owner(uuid) to anon, authenticated;
grant execute on function public.is_privileged_session() to anon, authenticated;
grant execute on function public.public_business_ids(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. Пазачи на колони: RLS не различава колони, тригерите го правят.
-- ---------------------------------------------------------------------------
-- businesses: собственикът редактира профила си, но не и полетата на админа
-- (статус, ниво, плащане, подредба, карта, адреси, индексиране).
create or replace function public.guard_business_admin_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (select public.is_privileged_session()) then
    return new;
  end if;

  if new.slug is distinct from old.slug
     or new.status is distinct from old.status
     or new.listing_tier is distinct from old.listing_tier
     or new.requested_plan_id is distinct from old.requested_plan_id
     or new.active_plan_id is distinct from old.active_plan_id
     or new.payment_status is distinct from old.payment_status
     or new.paid_until is distinct from old.paid_until
     or new.is_homepage_spotlight is distinct from old.is_homepage_spotlight
     or new.homepage_spotlight_until is distinct from old.homepage_spotlight_until
     or new.priority is distinct from old.priority
     or new.map_pin_x is distinct from old.map_pin_x
     or new.map_pin_y is distinct from old.map_pin_y
     or new.show_on_illustrated_map is distinct from old.show_on_illustrated_map
     or new.requested_services is distinct from old.requested_services
     or new.admin_notes is distinct from old.admin_notes
     or new.canonical_url is distinct from old.canonical_url
     or new.robots_index is distinct from old.robots_index
     or new.robots_follow is distinct from old.robots_follow
     or new.schema_type is distinct from old.schema_type
  then
    raise exception 'Това поле се променя само от администратор' using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_business_admin_columns on public.businesses;
create trigger guard_business_admin_columns
  before update on public.businesses
  for each row execute function public.guard_business_admin_columns();

-- business_translations: адресът (slug) и индексирането на всеки език са на админа.
create or replace function public.guard_business_translation_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (select public.is_privileged_session()) then
    return new;
  end if;

  if new.business_id is distinct from old.business_id
     or new.locale is distinct from old.locale
     or new.slug is distinct from old.slug
     or new.canonical_url is distinct from old.canonical_url
     or new.robots_index is distinct from old.robots_index
     or new.robots_follow is distinct from old.robots_follow
     or new.schema_type is distinct from old.schema_type
  then
    raise exception 'Адресът и индексирането се променят само от администратор' using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_business_translation_columns on public.business_translations;
create trigger guard_business_translation_columns
  before update on public.business_translations
  for each row execute function public.guard_business_translation_columns();

-- business_platform_settings: собственикът пипа само open_override.
create or replace function public.guard_platform_settings_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (select public.is_privileged_session()) then
    return new;
  end if;

  if new.business_id is distinct from old.business_id
     or new.platform_status is distinct from old.platform_status
     or new.plan is distinct from old.plan
  then
    raise exception 'Това поле се променя само от администратор' using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_platform_settings_columns on public.business_platform_settings;
create trigger guard_platform_settings_columns
  before update on public.business_platform_settings
  for each row execute function public.guard_platform_settings_columns();

-- business_modules: собственикът пипа само settings.
create or replace function public.guard_module_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (select public.is_privileged_session()) then
    return new;
  end if;

  if new.business_id is distinct from old.business_id
     or new.module is distinct from old.module
     or new.enabled is distinct from old.enabled
  then
    raise exception 'Модулите се включват само от администратор' using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_module_columns on public.business_modules;
create trigger guard_module_columns
  before update on public.business_modules
  for each row execute function public.guard_module_columns();

-- ---------------------------------------------------------------------------
-- 6. Версия на съдържанието: всяка промяна по менюто, екраните или
--    „Отворено/Затворено“ вдига брояча; телевизорите проверяват него.
--    Таблиците на менюто и екраните закачат bump_business_content_version()
--    в своите миграции.
-- ---------------------------------------------------------------------------
create or replace function public.bump_business_content_version()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_business_id uuid;
begin
  if tg_op = 'DELETE' then
    v_business_id := old.business_id;
  else
    v_business_id := new.business_id;
  end if;

  update public.business_platform_settings
  set content_version = content_version + 1
  where business_id = v_business_id;

  return null;
end;
$$;

-- Смяната на open_override е в същата таблица, затова се брои преди записа.
create or replace function public.bump_platform_settings_version()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.open_override is distinct from old.open_override then
    new.content_version := old.content_version + 1;
  end if;
  return new;
end;
$$;

drop trigger if exists bump_platform_settings_version on public.business_platform_settings;
create trigger bump_platform_settings_version
  before update on public.business_platform_settings
  for each row execute function public.bump_platform_settings_version();

-- ---------------------------------------------------------------------------
-- 7. RLS: една политика на действие, условията с `or` вътре
-- ---------------------------------------------------------------------------
alter table public.business_members enable row level security;
alter table public.business_platform_settings enable row level security;
alter table public.business_modules enable row level security;

-- business_members: членовете виждат екипа на своя бизнес; админът - всичко.
drop policy if exists "Members read their business memberships" on public.business_members;
create policy "Members read their business memberships"
  on public.business_members for select to authenticated
  using ((select public.is_admin()) or business_id in (select public.member_business_ids()));

-- Записи: админът всичко; собственикът само служители в своя бизнес
-- (порталът още не показва служители; политиката е готова за после).
drop policy if exists "Admins and owners add business members" on public.business_members;
create policy "Admins and owners add business members"
  on public.business_members for insert to authenticated
  with check ((select public.is_admin()) or (role = 'staff' and (select public.is_business_owner(business_id))));

drop policy if exists "Admins and owners update business members" on public.business_members;
create policy "Admins and owners update business members"
  on public.business_members for update to authenticated
  using ((select public.is_admin()) or (role = 'staff' and (select public.is_business_owner(business_id))))
  with check ((select public.is_admin()) or (role = 'staff' and (select public.is_business_owner(business_id))));

drop policy if exists "Admins and owners remove business members" on public.business_members;
create policy "Admins and owners remove business members"
  on public.business_members for delete to authenticated
  using ((select public.is_admin()) or (role = 'staff' and (select public.is_business_owner(business_id))));

-- business_platform_settings: членовете четат; собственикът обновява
-- (пазачът пуска само open_override); създаване и триене - админ.
drop policy if exists "Members read platform settings" on public.business_platform_settings;
create policy "Members read platform settings"
  on public.business_platform_settings for select to authenticated
  using ((select public.is_admin()) or business_id in (select public.member_business_ids()));

drop policy if exists "Admins create platform settings" on public.business_platform_settings;
create policy "Admins create platform settings"
  on public.business_platform_settings for insert to authenticated
  with check ((select public.is_admin()));

drop policy if exists "Admins and owners update platform settings" on public.business_platform_settings;
create policy "Admins and owners update platform settings"
  on public.business_platform_settings for update to authenticated
  using ((select public.is_admin()) or (select public.is_business_owner(business_id)))
  with check ((select public.is_admin()) or (select public.is_business_owner(business_id)));

drop policy if exists "Admins delete platform settings" on public.business_platform_settings;
create policy "Admins delete platform settings"
  on public.business_platform_settings for delete to authenticated
  using ((select public.is_admin()));

-- business_modules: същият модел; пазачът пуска на собственика само settings.
drop policy if exists "Members read business modules" on public.business_modules;
create policy "Members read business modules"
  on public.business_modules for select to authenticated
  using ((select public.is_admin()) or business_id in (select public.member_business_ids()));

drop policy if exists "Admins create business modules" on public.business_modules;
create policy "Admins create business modules"
  on public.business_modules for insert to authenticated
  with check ((select public.is_admin()));

drop policy if exists "Admins and owners update business modules" on public.business_modules;
create policy "Admins and owners update business modules"
  on public.business_modules for update to authenticated
  using ((select public.is_admin()) or (select public.is_business_owner(business_id)))
  with check ((select public.is_admin()) or (select public.is_business_owner(business_id)));

drop policy if exists "Admins delete business modules" on public.business_modules;
create policy "Admins delete business modules"
  on public.business_modules for delete to authenticated
  using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- 8. Собственикът и своят бизнес в съществуващите таблици
-- ---------------------------------------------------------------------------
-- Чете своя бизнес дори когато не е одобрен.
drop policy if exists "Approved businesses are public" on public.businesses;
create policy "Approved businesses are public"
  on public.businesses for select to anon, authenticated
  using (status = 'approved' or (select public.is_admin()) or id in (select public.member_business_ids()));

-- Обновява профила си; кои колони може да пипа решава пазачът по-горе.
drop policy if exists "Owners update their business" on public.businesses;
create policy "Owners update their business"
  on public.businesses for update to authenticated
  using ((select public.is_business_owner(id)))
  with check ((select public.is_business_owner(id)));

-- Преводите на своя бизнес: чете, добавя, обновява (адресът е пазен от тригера).
drop policy if exists "Owners read their business translations" on public.business_translations;
create policy "Owners read their business translations"
  on public.business_translations for select to authenticated
  using (business_id in (select public.member_business_ids()));

drop policy if exists "Owners add their business translations" on public.business_translations;
create policy "Owners add their business translations"
  on public.business_translations for insert to authenticated
  with check ((select public.is_business_owner(business_id)));

drop policy if exists "Owners update their business translations" on public.business_translations;
create policy "Owners update their business translations"
  on public.business_translations for update to authenticated
  using ((select public.is_business_owner(business_id)))
  with check ((select public.is_business_owner(business_id)));
