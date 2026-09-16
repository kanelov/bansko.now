-- Business Platform · стъпка 4: работно време и изключения по дати.
-- Ред в business_hours = интервал, в който е отворено (два реда = две смени);
-- ден без ред = затворено. Изключенията (празник, инвентаризация, удължено
-- време) са по дата и имат предимство. „Отворено сега“ се смята на сървъра в
-- Europe/Sofia; ръчният превключвател е в business_platform_settings.open_override.
-- Всичко е добавящо и идемпотентно.

create table if not exists public.business_hours (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  weekday smallint not null check (weekday between 1 and 7), -- 1 = понеделник … 7 = неделя (ISO)
  opens time not null,
  closes time not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, weekday, opens)
);

create index if not exists business_hours_business_weekday_idx on public.business_hours (business_id, weekday);

drop trigger if exists set_business_hours_updated_at on public.business_hours;
create trigger set_business_hours_updated_at
  before update on public.business_hours
  for each row execute function public.set_updated_at();

create table if not exists public.business_hour_exceptions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  date date not null,
  opens time,
  closes time,
  is_closed boolean not null default true,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, date),
  constraint business_hour_exceptions_times_check check (is_closed or (opens is not null and closes is not null))
);

create index if not exists business_hour_exceptions_business_date_idx on public.business_hour_exceptions (business_id, date);

drop trigger if exists set_business_hour_exceptions_updated_at on public.business_hour_exceptions;
create trigger set_business_hour_exceptions_updated_at
  before update on public.business_hour_exceptions
  for each row execute function public.set_updated_at();

-- Часовете стигат до QR менюто и профила: версията се вдига както при менюто.
drop trigger if exists bump_content_version on public.business_hours;
create trigger bump_content_version
  after insert or update or delete on public.business_hours
  for each row execute function public.bump_business_content_version();

drop trigger if exists bump_content_version on public.business_hour_exceptions;
create trigger bump_content_version
  after insert or update or delete on public.business_hour_exceptions
  for each row execute function public.bump_business_content_version();

-- RLS: публично четене при включен модул „часове“; собственикът пише своето.
alter table public.business_hours enable row level security;
alter table public.business_hour_exceptions enable row level security;

drop policy if exists "Business hours are readable" on public.business_hours;
create policy "Business hours are readable"
  on public.business_hours for select to anon, authenticated
  using (
    business_id in (select public.public_business_ids('hours'))
    or business_id in (select public.member_business_ids())
    or (select public.is_admin())
  );

drop policy if exists "Owners add business hours" on public.business_hours;
create policy "Owners add business hours"
  on public.business_hours for insert to authenticated
  with check ((select public.is_business_owner(business_id)) or (select public.is_admin()));

drop policy if exists "Owners update business hours" on public.business_hours;
create policy "Owners update business hours"
  on public.business_hours for update to authenticated
  using ((select public.is_business_owner(business_id)) or (select public.is_admin()))
  with check ((select public.is_business_owner(business_id)) or (select public.is_admin()));

drop policy if exists "Owners delete business hours" on public.business_hours;
create policy "Owners delete business hours"
  on public.business_hours for delete to authenticated
  using ((select public.is_business_owner(business_id)) or (select public.is_admin()));

drop policy if exists "Business hour exceptions are readable" on public.business_hour_exceptions;
create policy "Business hour exceptions are readable"
  on public.business_hour_exceptions for select to anon, authenticated
  using (
    business_id in (select public.public_business_ids('hours'))
    or business_id in (select public.member_business_ids())
    or (select public.is_admin())
  );

drop policy if exists "Owners add business hour exceptions" on public.business_hour_exceptions;
create policy "Owners add business hour exceptions"
  on public.business_hour_exceptions for insert to authenticated
  with check ((select public.is_business_owner(business_id)) or (select public.is_admin()));

drop policy if exists "Owners update business hour exceptions" on public.business_hour_exceptions;
create policy "Owners update business hour exceptions"
  on public.business_hour_exceptions for update to authenticated
  using ((select public.is_business_owner(business_id)) or (select public.is_admin()))
  with check ((select public.is_business_owner(business_id)) or (select public.is_admin()));

drop policy if exists "Owners delete business hour exceptions" on public.business_hour_exceptions;
create policy "Owners delete business hour exceptions"
  on public.business_hour_exceptions for delete to authenticated
  using ((select public.is_business_owner(business_id)) or (select public.is_admin()));
