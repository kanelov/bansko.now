# Шаблонни снимки за бизнеси без собствена снимка

Докато бизнесът (или собственикът на Bansko NOW) не качи истинска снимка, профилът в каталога
показва една обща илюстрация за своя тип бизнес. Илюстрациите са нарочно **нереалистични**
(рисувани, без лица и без надписи), за да не изглеждат като снимка на конкретното заведение.

## Избран стил (22.11.2026): „ретро линия“

Собственикът избра стил А от три проби (ретро линия като рисунките на kanelov.com, линогравюра,
гваш плакат). Илюстрациите се правят с Codex на Mac-а (`codex exec … "<промпт>"`, вграденият
генератор на картинки, 1536 × 1024 PNG) и се качват от Админ → „Бизнес каталог“ →
„Илюстрации за бизнеси без снимка“: сайтът ги смалява до 1200 px WebP (качество 72, около 150 KB) и ги записва
като `business/placeholders/placeholder-<slug>.webp`. Работната папка на Mac-а е
`~/bansko-now-placeholders` (скриптът `gen.py` с промптовете); след качването се трие.

Стилът, който се слага във всеки промпт:

```
Style: retro risograph-style illustration with thin dark brown outlines and flat fills slightly
offset from the lines like a two-pass print, subtle paper grain, mid-century illustration feel,
warm vintage postcard look. Wide landscape 3:2 (1536x1024). No people, no faces, no text, no
letters, no numbers, no logos, no signage, no watermark. Palette: warm cream paper (#f4eee2),
forest green (#1f3d2b), moss green, clay orange, mustard, soft wood tones.
```

## Първоначален общ стил (16.10.2026, заменен)

```
Editorial flat illustration for a mountain-town lifestyle magazine, Bansko, Bulgaria.
Warm cream paper background (#f6f1e7), forest green (#1f3d2b), moss, clay and soft wood tones.
Simple shapes, light grain texture, generous negative space, no people, no faces, no text,
no logos, no signage. Wide 3:2 composition, subject centered, calm morning light,
Pirin mountains hinted in the background. Consistent with a set of 10 category illustrations.
```

Размер: 1800 × 1200 px (3:2). След генериране: запис като WebP, качество 80, име
`placeholder-<slug>.webp` (например `placeholder-cafes.webp`), качване в R2 под
`business/placeholders/`. Негативен промпт (ако инструментът има такъв): `photo, realistic,
people, faces, text, letters, watermark, logo, signage, neon, clutter`.

## Промптове по категория (slug от `business_categories`)

| Slug | Категория | Сюжет |
| --- | --- | --- |
| `restaurants` | Ресторанти | A wooden table by a window with a clay pot of stew, bread and a glass of red wine; stone wall and a small fireplace glow behind, Bansko tavern feeling. |
| `cafes` | Кафета | A ceramic cup of coffee with latte art and a croissant on a small round table, a window with soft light, a potted plant, snowy peak outside. |
| `hotels` | Хотели | A chalet-style hotel facade with wooden balconies and warm windows at dusk, pine trees, fresh snow on the roof, a lit entrance path. |
| `guest-houses` | Къщи за гости | A traditional Bansko stone-and-timber house with a wooden gate, geraniums on the windowsill, a courtyard with a walnut tree. |
| `services` | Услуги | A tidy workbench with a few tools (wrench, scissors, measuring tape, keys) laid out neatly, a notebook and a mug, workshop window with mountain view. |
| `shops` | Магазини | A small shop window with wooden shelves of local goods: honey jars, wool socks, ceramics, a paper bag; awning above, cobblestone street. |
| `activities` | Активности | A hiking trail sign with two blank wooden arrows, a backpack and trekking poles leaning on it, alpine meadow and a lake below the peaks. |
| `health-sport` | Здраве и спорт | A yoga mat, a towel, a water bottle and a pair of skis leaning on a wooden wall, big window with snowy pines, calm spa-like mood. |
| `transport` | Транспорт | A small minibus with a roof rack of skis parked at a mountain road bend, pines and a cable car line in the distance, early morning. |
| `culture` | Култура | A wooden stage with a bass, a violin and a folk drum in soft spotlight, stone square and old church silhouette behind, festival lanterns. |

## Как се ползват

1. Генерирай десетте илюстрации с един и същ инструмент и настройки, за да са еднакви по стил.
2. Качи ги в R2 (`banskonow/business/placeholders/`), публичният адрес е
   `https://cdn.bansko.now/business/placeholders/placeholder-<slug>.webp`.
3. Каталогът показва шаблона, когато бизнесът няма нито една своя снимка; щом бизнесът или
   админът качи снимка, шаблонът отпада сам (не се записва в профила). Кодът:
   `src/lib/business-placeholders.ts` (адрес по slug на категорията, проверка веднъж на ден с HEAD
   кои файлове съществуват) и `withBusinessPlaceholders()` в `src/lib/businesses.ts`, което слага
   `placeholder_image_url` при четене; показва се в `BusinessMedia` (картите, картата, блока на
   началната страница), в горната част на профила, в Open Graph и в JSON-LD `image`. Докато файлът
   за дадена категория не е качен, картата показва цветния панел.
4. Истинските снимки идват от: Админ → Бизнеси (снимки и видеа), бизнес портала (меню/бранд)
   или формата „Добави бизнес“.
