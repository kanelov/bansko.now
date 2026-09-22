-- Иконка на категория в менюто (Font Awesome име, например mug-saucer). Празно =
-- страницата я познава по името на категорията (src/lib/business-platform/menu-icons.ts).
alter table public.business_menu_categories add column if not exists icon_name text;
