# Импорт на бизнес каталога на bansko.bg (подготвен на 2026-10-31)

Състояние: **подготвен, не е приложен**. Собственикът одобри: всички 259 записа, без публикуване на
имейли, описанията пренаписани в наш стил (BG + EN).

## Какво има

- Източник: `https://bansko.bg/za-biznesa/biznes-katalog/` (259 бизнеса, 6 родителски категории и
  подкатегории; снимките им **не** се ползват).
- Резултат: 257 записа (2 дубликата в източника са махнати: „Зора-КК“ ×2, Bansko Fun Holidays ×2).
- Генерира се наново от `tools/bansko-bg-import/` (в Git, без лични данни): `crawl.py <папка>` сваля
  каталога (bansko.bg трябва да е в Allowed domains), `parse.py <папка>` прави `bansko-bg-biznesi.csv`
  с фактите и нашата категория, `build_import.py <папка>` сглобява `import-bansko-bg.sql` +
  `import-preview.csv` от CSV-то и готовите текстове в `texts/chunk*.json` (новите BG/EN имена, описания,
  alt текстове – написани на 2026-10-31). Резултатът е идентичен с одобрения от собственика. Готовите
  SQL/CSV **не** се качват в Git (имат имейли за връзка).
- Съответствие на категориите: подкатегориите на общината → нашите десет (`business_categories.slug`):
  restaurants 13, cafes 8, hotels 23, guest-houses 13, services 84, shops 34, activities 8,
  health-sport 55, transport 6, culture 13.

## Какво прави SQL-ът

За всеки ред: `businesses` (име, slug от името, категория + `category_id`, описание BG, адрес,
телефон във формат `+359 …`, сайт, Facebook, Instagram, `status = 'approved'`, `listing_tier = 'free'`,
`show_on_illustrated_map = false`, `admin_notes` = „Импорт от bansko.bg (31.10.2026). Източник: …
Имейл за връзка (не се публикува): …“), `business_translations` за `bg` и `en` (име, описание, адрес,
alt текст на шаблонната илюстрация), `business_contacts` (име на бизнеса, телефон, имейл) когато има
имейл. Всичко в една транзакция; временни таблици; пропуска slug, който вече съществува.

Специални: „Арт Идея“ влиза с адрес ул. „Никола Й. Вапцаров“ 8 и координати 41.837099, 23.4880923
(Google Maps), сайт artidea.bg, категория „Култура“.

## Стъпки за прилагане (нова сесия с токена за ART GALLERY)

1. Провери, че `SUPABASE_TOKEN_ARTGALLERY` вижда проекта `rzjyawjdhcedddydmfge`
   (`GET /v1/projects/rzjyawjdhcedddydmfge` → 200).
2. Преди: `select count(*) from businesses;` и списък на съществуващите slug-ове.
3. Пусни `import-bansko-bg.sql` през Management API (`POST …/database/query`). Отговорът връща
   `inserted`.
4. След: броят е +257; `select count(*) from business_translations where locale='en'`; няколко
   примерни профила: `/places/art-ideya`, `/places/mehana-vodenitsata`, `/en/places/vodenitsata-tavern`.
5. Yum Spot (демо кафето, `5be5ae6e-d472-4e2d-a962-a1b98935261a`): адрес ул. „Никола Й. Вапцаров“ 8,
   същите координати като галерията, махни „Демо профил“ от описанието и Unsplash снимката; истински
   снимки дава собственикът.
6. `/places` е ISR 15 мин – след импорта презареди кеша (деплой или `revalidateBusinessPublic`).

## Шаблонни илюстрации

Профил без собствена снимка показва илюстрацията на категорията си:
`https://cdn.bansko.now/business/placeholders/placeholder-<slug>.webp` (виж
`docs/biznes-shabloni-snimki.md`). Кодът за това още не е написан – влиза с качването на десетте
илюстрации (`BusinessCard`, профилът и `og_image_url`).

## Решения на собственика (2026-10-31)

Данните са публични – без имейл до общината и без ред „източник“ в профилите. Имейлите на бизнесите
не се публикуват (стоят само в `admin_notes` и `business_contacts`); описанията са наши; снимки не се
копират; профил се поправя или маха по молба на бизнеса.
