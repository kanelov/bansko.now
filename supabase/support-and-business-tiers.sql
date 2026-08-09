-- Keep the public offer intentionally simple: free, premium and homepage focus.
insert into public.business_listing_plans
  (name, slug, tier, period_months, price, currency, description, benefits, is_active, sort_order)
values
  (
    'Безплатно присъствие',
    'free-listing',
    'free',
    12,
    0,
    'BGN',
    'Основен профил в каталога след редакторско одобрение.',
    array['Профил в каталога', 'Адрес и упътване', 'До 3 снимки'],
    true,
    10
  ),
  (
    'Премиум бизнес - 1 година',
    'premium-12-months',
    'premium',
    12,
    0,
    'BGN',
    'Силен визуален акцент и приоритетно позициониране в каталога.',
    array['Широка карта', 'Приоритетна позиция', 'Видео представяне', 'По-видим pin на картата'],
    true,
    20
  ),
  (
    'На фокус - 1 година',
    'homepage-spotlight-12-months',
    'homepage',
    12,
    0,
    'BGN',
    'Най-висока видимост в каталога и възможност за представяне на началната страница.',
    array['Широка карта', 'Най-висока видимост', 'На фокус на началната страница'],
    true,
    30
  )
on conflict (slug) do update
set
  name = excluded.name,
  tier = excluded.tier,
  period_months = excluded.period_months,
  description = excluded.description,
  benefits = excluded.benefits,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order,
  updated_at = now();

do $$
declare
  premium_plan_id uuid;
begin
  select id into premium_plan_id
  from public.business_listing_plans
  where slug = 'premium-12-months';

  update public.businesses
  set active_plan_id = premium_plan_id
  where active_plan_id in (
    select id from public.business_listing_plans where tier = 'featured'
  );

  update public.businesses
  set requested_plan_id = premium_plan_id
  where requested_plan_id in (
    select id from public.business_listing_plans where tier = 'featured'
  );

  update public.businesses
  set listing_tier = 'premium'
  where listing_tier = 'featured';
end
$$;

delete from public.business_listing_plans
where tier = 'featured';

alter table public.business_listing_plans
  drop constraint if exists business_listing_plans_tier_check;

alter table public.business_listing_plans
  add constraint business_listing_plans_tier_check
  check (tier in ('free', 'premium', 'homepage'));

alter table public.businesses
  drop constraint if exists businesses_listing_tier_check;

alter table public.businesses
  add constraint businesses_listing_tier_check
  check (listing_tier in ('free', 'premium', 'homepage'));

alter table public.site_settings
  add column if not exists support_enabled boolean not null default true,
  add column if not exists support_button_label text default 'Подкрепи ни',
  add column if not exists support_title text default 'Подкрепи Bansko NOW',
  add column if not exists support_description text default 'Ако Bansko NOW ти е полезен, можеш да подкрепиш независимите местни истории, снимки и идеи с избрана от теб сума.',
  add column if not exists support_image_url text,
  add column if not exists support_image_alt text default 'Банско и Пирин - вдъхновение за Bansko NOW',
  add column if not exists support_stripe_url text,
  add column if not exists support_paypal_url text;

update public.business_directory_settings
set
  premium_offer_title = 'Избери как да присъства бизнесът ти',
  premium_offer_description = 'Безплатното присъствие е по подразбиране. Премиум и На фокус са годишни нива за по-силна видимост в Bansko NOW.',
  updated_at = now();
