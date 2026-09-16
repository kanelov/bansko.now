-- Business Platform · поправка на seed-а на категориите.
-- В първата версия на 20260916120100 преводите се вмъкваха в същата заявка,
-- в която се създаваха категориите (CTE) - Postgres не вижда редовете от CTE
-- в останалата част на заявката, затова преводите и преносът останаха празни.
-- Файлът е поправен; тази миграция довършва живата база. Идемпотентна.
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

update public.businesses b
set category_id = t.category_id
from public.business_category_translations t
where t.locale = 'bg'
  and b.category_id is null
  and btrim(b.category) = t.name;
