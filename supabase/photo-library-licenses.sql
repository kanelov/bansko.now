-- Seed for the two photo license types. The wording stays editable from the admin;
-- every paid order freezes a snapshot of the text that was shown at purchase time.
-- Do NOT run this again on production after the texts were edited in the admin
-- (Фотоархив → „Текстове и лицензи“): the upsert below overwrites them.
insert into public.photo_license_types
  (code, name_bg, name_en, summary_bg, summary_en, download_variant,
   price_standard_eur, price_premium_eur, print_run_limit, terms_version, sort_order, terms_bg, terms_en)
values
  ('WEB', 'Уеб лиценз', 'Web License',
   'За дигитална употреба: сайт, блог, онлайн издание, социални мрежи и презентации. Без печат за разпространение и без продукти за продажба.',
   'For digital use: website, blog, online publication, social media and presentations. No print distribution and no products for resale.',
   'web_license', 30.00, 50.00, null, 1, 10,
   'Носител на авторското право: Любо Канелов (bansko.now). Авторското право остава изцяло у автора. Плащането дава право на ползване и не прехвърля собственост върху фотографията.

Лицензът е неизключителен, безсрочен, за целия свят и е поименен: важи само за купувача, посочен в поръчката (едно физическо лице или една фирма).

РАЗРЕШЕНО
1. Публикуване в дигитална среда на купувача: собствен сайт, блог, онлайн издание, статия, бюлетин, онлайн магазин като илюстрация.
2. Социални мрежи и дигитални презентации на купувача.
3. Платена онлайн реклама на собствената дейност на купувача.
4. Изрязване и леки корекции на цвят, доколкото не променят съдържанието на фотографията.

ЗАДЪЛЖИТЕЛНО
5. При редакционна и онлайн публикация се посочва авторство: „© Любо Канелов / bansko.now“, освен ако писмено е уговорено друго.

ЗАБРАНЕНО
6. Печат за разпространение: списания, книги, брошури, плакати, рекламни и печатни материали. За това служи Разширеният лиценз за печат.
7. Продажба, преотстъпване, споделяне или качване на файла на трети лица, включително в стокови библиотеки, платформи за шаблони и NFT.
8. Използване върху продукти, предназначени за продажба: тениски, чаши, картички, календари, плакати, магнити, картини, сувенири и подобни.
9. Продажба на фотографията или на производно от нея като изображение, принт или дигитален файл.
10. Използване за обучение на изкуствен интелект и за създаване на производни изображения с изкуствен интелект.
11. Използване, което създава конкурентен продукт на галерия „Арт Идея“ и Art Studio Банско: производство, продажба или разпространение на печатни продукти и сувенири с фотографията.
12. Използване в опозоряващ, дискриминационен или подвеждащ контекст, както и внушение, че авторът подкрепя продукт, кауза или лице.

ФАЙЛ И ДОСТАВКА
13. Купувачът получава файл до 3000 пиксела по дългата страна, без воден знак, подходящ за дигитална употреба.
14. Достъпът до файла се предоставя веднага след плащане. С потвърждаването на поръчката купувачът се съгласява да получи цифровото съдържание незабавно и се отказва от правото на отказ от договора.

ПРЕКРАТЯВАНЕ
15. При нарушение лицензът се прекратява автоматично, без връщане на платената сума, а авторът има право на обезщетение по закон.',
   'Copyright holder: Lubo Kanelov (bansko.now). The copyright remains entirely with the photographer. Payment grants a right of use and does not transfer ownership of the photograph.

The license is non-exclusive, perpetual, worldwide and personal: it applies only to the purchaser named in the order (one individual or one company).

PERMITTED
1. Publication in the purchaser''s digital media: own website, blog, online publication, article, newsletter, online shop as an illustration.
2. The purchaser''s social media and digital presentations.
3. Paid online advertising of the purchaser''s own activity.
4. Cropping and light colour correction, as long as the content of the photograph is not altered.

REQUIRED
5. Editorial and online publication must credit the author: "© Lubo Kanelov / bansko.now", unless agreed otherwise in writing.

NOT PERMITTED
6. Print for distribution: magazines, books, brochures, posters, advertising and printed materials. The Extended Print License covers that.
7. Selling, transferring, sharing or uploading the file to third parties, including stock libraries, template platforms and NFTs.
8. Use on products intended for sale: T-shirts, mugs, postcards, calendars, posters, magnets, wall art, souvenirs and similar.
9. Selling the photograph or a derivative of it as an image, print or digital file.
10. Use for training artificial intelligence or for generating derivative images with artificial intelligence.
11. Use that creates a competing product to Art Idea Gallery and Art Studio Bansko: producing, selling or distributing printed products and souvenirs with the photograph.
12. Use in a defamatory, discriminatory or misleading context, or implying that the author endorses a product, cause or person.

FILE AND DELIVERY
13. The purchaser receives a file up to 3000 pixels on the long edge, without a watermark, suitable for digital use.
14. Access to the file is granted immediately after payment. By confirming the order the purchaser agrees to receive the digital content immediately and waives the right of withdrawal.

TERMINATION
15. Any breach terminates the license automatically, without a refund, and the author is entitled to compensation under the law.'),
  ('PRINT_EXTENDED', 'Разширен лиценз за печат', 'Extended Print License',
   'Всичко от уеб лиценза плюс печат в собствени материали до 5000 копия. Без продукти за препродажба.',
   'Everything in the web license plus printing in the purchaser''''s own materials up to 5000 copies. No products for resale.',
   'full_resolution', 120.00, 250.00, 5000, 1, 20,
   'Разширеният лиценз за печат включва всички права и всички задължения по Уеб лиценза и добавя правото за печат.

РАЗРЕШЕНО ДОПЪЛНИТЕЛНО
1. Печат в собствени материали на купувача: списание, вестник, книга, брошура, флаер, меню, каталог, фирмени материали.
2. Плакати, табели и изложбена графика за собствена употреба на купувача, включително в обект, офис или на щанд.
3. Общ тираж до 5000 копия за всички печатни материали по този лиценз. За по-голям тираж се договаря отделно.

ОСТАВА ЗАБРАНЕНО
4. Продукти, предназначени за препродажба: плакати, картички, календари, тениски, чаши, магнити, сувенири, картини и всяка стока, чиято стойност се формира от фотографията.
5. Препродажба, преотстъпване или споделяне на файла.
6. Всичко останало, забранено в Уеб лиценза, включително употреба, конкурираща галерия „Арт Идея“ и Art Studio Банско.

ФАЙЛ И ДОСТАВКА
7. Купувачът получава оригиналния файл с висока резолюция, без воден знак.
8. Достъпът до файла се предоставя веднага след плащане. С потвърждаването на поръчката купувачът се съгласява да получи цифровото съдържание незабавно и се отказва от правото на отказ от договора.

ПРЕКРАТЯВАНЕ
9. При нарушение лицензът се прекратява автоматично, без връщане на платената сума, а авторът има право на обезщетение по закон.',
   'The Extended Print License includes every right and every obligation of the Web License and adds the right to print.

ADDITIONALLY PERMITTED
1. Printing in the purchaser''s own materials: magazine, newspaper, book, brochure, flyer, menu, catalogue, company materials.
2. Posters, signage and exhibition graphics for the purchaser''s own use, including in a venue, office or at a stand.
3. A total print run of up to 5000 copies across all printed materials under this license. Larger runs are agreed separately.

STILL NOT PERMITTED
4. Products intended for resale: posters, postcards, calendars, T-shirts, mugs, magnets, souvenirs, wall art and any goods whose value comes from the photograph.
5. Reselling, transferring or sharing the file.
6. Everything else prohibited in the Web License, including use that competes with Art Idea Gallery and Art Studio Bansko.

FILE AND DELIVERY
7. The purchaser receives the original high-resolution file, without a watermark.
8. Access to the file is granted immediately after payment. By confirming the order the purchaser agrees to receive the digital content immediately and waives the right of withdrawal.

TERMINATION
9. Any breach terminates the license automatically, without a refund, and the author is entitled to compensation under the law.')
on conflict (code) do update set
  name_bg = excluded.name_bg,
  name_en = excluded.name_en,
  summary_bg = excluded.summary_bg,
  summary_en = excluded.summary_en,
  download_variant = excluded.download_variant,
  price_standard_eur = excluded.price_standard_eur,
  price_premium_eur = excluded.price_premium_eur,
  print_run_limit = excluded.print_run_limit,
  terms_bg = excluded.terms_bg,
  terms_en = excluded.terms_en,
  sort_order = excluded.sort_order;
