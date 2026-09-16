-- Business Platform · стъпка 1: категориите на бизнесите като данни.
-- Днес списъкът е масив от 10 низа в src/lib/businesses.ts, а businesses.category
-- е свободен текст. Таблицата дава преводи, икона и ред; старите текстови колони
-- остават, докато кодът мине на category_id.

create table if not exists public.business_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  icon_name text,
  sort_order integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.business_category_translations (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.business_categories(id) on delete cascade,
  locale text not null check (locale in ('bg', 'en')),
  name text not null,
  unique (category_id, locale)
);

drop trigger if exists set_business_categories_updated_at on public.business_categories;
create trigger set_business_categories_updated_at
  before update on public.business_categories
  for each row execute function public.set_updated_at();

-- Профилни полета върху businesses: категория като връзка, телефон и публичен
-- имейл на самия бизнес (досега телефонът беше само в контакта на собственика).
alter table public.businesses
  add column if not exists category_id uuid references public.business_categories(id) on delete set null,
  add column if not exists phone text,
  add column if not exists email_public text;

create index if not exists businesses_category_id_idx on public.businesses (category_id);

-- Днешните десет категории, с икони от Font Awesome (free solid).
-- Две отделни заявки нарочно: промяна от CTE не се вижда в същата заявка.
insert into public.business_categories (slug, icon_name, sort_order)
values
  ('restaurants', 'utensils', 10),
  ('cafes', 'mug-hot', 20),
  ('hotels', 'hotel', 30),
  ('guest-houses', 'house', 40),
  ('services', 'screwdriver-wrench', 50),
  ('shops', 'bag-shopping', 60),
  ('activities', 'person-hiking', 70),
  ('health-sport', 'heart-pulse', 80),
  ('transport', 'car', 90),
  ('culture', 'masks-theater', 100)
on conflict (slug) do nothing;

insert into public.business_category_translations (category_id, locale, name)
select c.id, v.locale, v.name
from (
  values
    ('restaurants', 'bg', 'Ресторанти'), ('restaurants', 'en', 'Restaurants'),
    ('cafes', 'bg', 'Кафета'), ('cafes', 'en', 'Cafés'),
    ('hotels', 'bg', 'Хотели'), ('hotels', 'en', 'Hotels'),
    ('guest-houses', 'bg', 'Къщи за гости'), ('guest-houses', 'en', 'Guest houses'),
    ('services', 'bg', 'Услуги'), ('services', 'en', 'Services'),
    ('shops', 'bg', 'Магазини'), ('shops', 'en', 'Shops'),
    ('activities', 'bg', 'Активности'), ('activities', 'en', 'Activities'),
    ('health-sport', 'bg', 'Здраве и спорт'), ('health-sport', 'en', 'Health & sport'),
    ('transport', 'bg', 'Транспорт'), ('transport', 'en', 'Transport'),
    ('culture', 'bg', 'Култура'), ('culture', 'en', 'Culture')
) as v(slug, locale, name)
join public.business_categories c on c.slug = v.slug
on conflict (category_id, locale) do nothing;

-- Пренос: свободният текст в businesses.category към връзката, по българското име.
update public.businesses b
set category_id = t.category_id
from public.business_category_translations t
where t.locale = 'bg'
  and b.category_id is null
  and btrim(b.category) = t.name;

-- RLS: публично четене на активните, записи само от админа.
alter table public.business_categories enable row level security;
alter table public.business_category_translations enable row level security;

drop policy if exists "Active business categories are public" on public.business_categories;
create policy "Active business categories are public"
  on public.business_categories for select to anon, authenticated
  using (is_active or (select public.is_admin()));

drop policy if exists "Admins create business categories" on public.business_categories;
create policy "Admins create business categories"
  on public.business_categories for insert to authenticated
  with check ((select public.is_admin()));

drop policy if exists "Admins update business categories" on public.business_categories;
create policy "Admins update business categories"
  on public.business_categories for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Admins delete business categories" on public.business_categories;
create policy "Admins delete business categories"
  on public.business_categories for delete to authenticated
  using ((select public.is_admin()));

drop policy if exists "Business category translations are public" on public.business_category_translations;
create policy "Business category translations are public"
  on public.business_category_translations for select to anon, authenticated
  using (
    exists (
      select 1
      from public.business_categories c
      where c.id = category_id and (c.is_active or (select public.is_admin()))
    )
  );

drop policy if exists "Admins create business category translations" on public.business_category_translations;
create policy "Admins create business category translations"
  on public.business_category_translations for insert to authenticated
  with check ((select public.is_admin()));

drop policy if exists "Admins update business category translations" on public.business_category_translations;
create policy "Admins update business category translations"
  on public.business_category_translations for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Admins delete business category translations" on public.business_category_translations;
create policy "Admins delete business category translations"
  on public.business_category_translations for delete to authenticated
  using ((select public.is_admin()));
