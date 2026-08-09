-- Keep one clear annual option per visibility tier.
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
    array['Приоритетна позиция', 'Премиум визуален акцент', 'По-видим pin на картата'],
    true,
    30
  ),
  (
    'На фокус - 1 година',
    'homepage-spotlight-12-months',
    'homepage',
    12,
    0,
    'BGN',
    'Най-висока видимост в каталога и възможност за представяне на началната страница.',
    array['Най-висока видимост', 'На фокус на началната страница', 'Премиум визуален блок'],
    true,
    40
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

update public.businesses as business
set active_plan_id = replacement.id
from public.business_listing_plans as current_plan
join public.business_listing_plans as replacement
  on replacement.slug = case current_plan.tier
    when 'free' then 'free-listing'
    when 'featured' then 'premium-12-months'
    when 'premium' then 'premium-12-months'
    when 'homepage' then 'homepage-spotlight-12-months'
  end
where business.active_plan_id = current_plan.id
  and current_plan.period_months <> 12;

update public.businesses as business
set requested_plan_id = replacement.id
from public.business_listing_plans as current_plan
join public.business_listing_plans as replacement
  on replacement.slug = case current_plan.tier
    when 'free' then 'free-listing'
    when 'featured' then 'premium-12-months'
    when 'premium' then 'premium-12-months'
    when 'homepage' then 'homepage-spotlight-12-months'
  end
where business.requested_plan_id = current_plan.id
  and current_plan.period_months <> 12;

delete from public.business_listing_plans
where period_months <> 12;

alter table public.business_listing_plans
  alter column period_months set default 12;

alter table public.business_listing_plans
  drop constraint if exists business_listing_plans_period_months_check;

alter table public.business_listing_plans
  add constraint business_listing_plans_period_months_check
  check (period_months = 12);

update public.business_directory_settings
set
  premium_offer_title = 'Избери как да присъства бизнесът ти',
  premium_offer_description = 'Безплатното присъствие е по подразбиране. При желание избери годишно ниво за по-силна видимост в Bansko NOW.',
  updated_at = now();
