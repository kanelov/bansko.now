-- Подкатегория („вид“) на бизнеса по език: „Механа“, „Аптека“, „Дентален кабинет“…
-- Главната категория остава една от десетте в business_categories; подкатегорията е втори, по-подробен етикет
-- (взет от каталога на bansko.bg при импорта на 2026-10-31) и втори филтър в /places.
-- Адитивна, идемпотентна. RLS не се променя: колоната е в business_translations.
alter table public.business_translations
  add column if not exists subcategory text;

comment on column public.business_translations.subcategory is 'Подкатегория по език (напр. Механа, Аптека); свободен текст, по желание.';
