-- Нови категории на бизнесите (2026-11-22, решение на собственика).
-- „Здраве и спорт“ се разделя на „Здраве“ и „Спорт“, а от „Услуги“, „Магазини“,
-- „Активности“ и „Култура“ се отделят видовете, които общината (bansko.bg) води
-- отделно: „Ски и сноуборд“, „Красота и спа“, „Недвижими имоти“, „Образование“.
-- Автосервизите и сродните отиват в „Транспорт“. Подкатегорията (от общината)
-- решава къде отива бизнесът. Идемпотентно: при повторно пускане нищо не се мести
-- втори път, защото вече не отговаря на условията.

-- 1) „Здраве и спорт“ става „Спорт“ (същият ред, нов slug и име).
update public.business_categories set slug = 'sport', icon_name = 'dumbbell', sort_order = 82
where slug = 'health-sport';
update public.business_category_translations t set name = case t.locale when 'bg' then 'Спорт' else 'Sport' end
from public.business_categories c
where c.id = t.category_id and c.slug = 'sport';

-- 2) Новите категории.
insert into public.business_categories (slug, icon_name, sort_order, is_active)
values
  ('health', 'heart-pulse', 80, true),
  ('ski', 'person-skiing', 72, true),
  ('beauty', 'spa', 55, true),
  ('real-estate', 'key', 57, true),
  ('education', 'graduation-cap', 105, true)
on conflict (slug) do nothing;

insert into public.business_category_translations (category_id, locale, name)
select c.id, v.locale, v.name
from (values
  ('health', 'bg', 'Здраве'), ('health', 'en', 'Health'),
  ('ski', 'bg', 'Ски и сноуборд'), ('ski', 'en', 'Ski & snowboard'),
  ('beauty', 'bg', 'Красота и спа'), ('beauty', 'en', 'Beauty & spa'),
  ('real-estate', 'bg', 'Недвижими имоти'), ('real-estate', 'en', 'Real estate'),
  ('education', 'bg', 'Образование'), ('education', 'en', 'Education')
) as v(slug, locale, name)
join public.business_categories c on c.slug = v.slug
on conflict (category_id, locale) do update set name = excluded.name;

-- 3) Местене по подкатегорията (българският превод).
create temporary table category_moves (subcategory text primary key, target_slug text not null) on commit drop;
insert into category_moves (subcategory, target_slug) values
  ('Дентален кабинет', 'health'),
  ('Аптека', 'health'),
  ('Общопрактикуващ лекар', 'health'),
  ('Лаборатория', 'health'),
  ('Гастроентерология и вътрешни болести', 'health'),
  ('Дом за възрастни', 'health'),
  ('Ендокринология и болести на обмяната', 'health'),
  ('Медицински център', 'health'),
  ('Оптика', 'health'),
  ('Акушерство и гинекология', 'health'),
  ('Ски и сноуборд услуги', 'ski'),
  ('Ски и сноуборд екипировка', 'ski'),
  ('Салон за красота', 'beauty'),
  ('Парфюмерия и козметика', 'beauty'),
  ('Красота и мода', 'beauty'),
  ('Недвижими имоти', 'real-estate'),
  ('Училище', 'education'),
  ('Детска градина', 'education'),
  ('Образователен център', 'education'),
  ('Авточасти и аксесоари', 'transport'),
  ('Авто-мото', 'transport'),
  ('Автошкола', 'education'),
  ('Автосервиз', 'transport'),
  ('Автомивка', 'transport'),
  ('Пътна помощ', 'transport');

create temporary table business_moves on commit drop as
select b.id as business_id, c.id as category_id, c.slug
from public.businesses b
join public.business_translations bt on bt.business_id = b.id and bt.locale = 'bg'
join category_moves m on m.subcategory = bt.subcategory
join public.business_categories c on c.slug = m.target_slug
where b.category_id is distinct from c.id;

update public.businesses b
set category_id = m.category_id,
    category = (select name from public.business_category_translations where category_id = m.category_id and locale = 'bg')
from business_moves m
where b.id = m.business_id;

update public.business_translations t
set category = (select name from public.business_category_translations where category_id = m.category_id and locale = t.locale)
from business_moves m
where t.business_id = m.business_id;

-- 4) Бизнесите, останали в „Спорт“, носят новото име и в текстовите полета.
update public.businesses b set category = 'Спорт'
from public.business_categories c
where c.id = b.category_id and c.slug = 'sport' and b.category is distinct from 'Спорт';

update public.business_translations t set category = case t.locale when 'bg' then 'Спорт' else 'Sport' end
from public.businesses b join public.business_categories c on c.id = b.category_id
where b.id = t.business_id and c.slug = 'sport';
