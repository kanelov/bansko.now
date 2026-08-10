-- Editable localized copy for the reusable blocks shown below articles.

alter table public.site_settings_translations
  add column if not exists facebook_cta_eyebrow text,
  add column if not exists facebook_cta_title text,
  add column if not exists facebook_cta_text text,
  add column if not exists facebook_cta_button_label text,
  add column if not exists art_studio_block_eyebrow text,
  add column if not exists art_studio_block_title text,
  add column if not exists art_studio_block_text text,
  add column if not exists art_studio_block_button_label text,
  add column if not exists collection_block_eyebrow text,
  add column if not exists collection_block_title text,
  add column if not exists collection_block_text text,
  add column if not exists collection_block_button_label text,
  add column if not exists collection_items text[];

update public.site_settings_translations
set
  facebook_cta_eyebrow = coalesce(facebook_cta_eyebrow, 'Общност'),
  facebook_cta_title = coalesce(facebook_cta_title, 'Присъедини се към общността'),
  facebook_cta_text = coalesce(facebook_cta_text, 'Имаш събитие, снимка, препоръка или въпрос за Банско? Сподели го в Bansko NOW | Живот в Банско.'),
  facebook_cta_button_label = coalesce(facebook_cta_button_label, 'Към Facebook групата'),
  art_studio_block_eyebrow = coalesce(art_studio_block_eyebrow, 'Art Studio към Bansko NOW'),
  art_studio_block_title = coalesce(art_studio_block_title, 'Визуални услуги с характер'),
  art_studio_block_text = coalesce(art_studio_block_text, 'Фотография, арт печат, платна и визуални решения, вдъхновени от Банско и Пирин.'),
  art_studio_block_button_label = coalesce(art_studio_block_button_label, 'Виж Art Studio'),
  collection_block_eyebrow = coalesce(collection_block_eyebrow, 'Вдъхновено от Банско'),
  collection_block_title = coalesce(collection_block_title, 'Bansko Collection'),
  collection_block_text = coalesce(collection_block_text, 'Авторски продукти за хората, които искат да отнесат част от Банско със себе си.'),
  collection_block_button_label = coalesce(collection_block_button_label, 'Разгледай колекцията'),
  collection_items = coalesce(collection_items, array['Тениски', 'Чаши', 'Постери', 'Фото принтове'])
where locale = 'bg';

update public.site_settings_translations
set
  facebook_cta_eyebrow = coalesce(facebook_cta_eyebrow, 'Community'),
  facebook_cta_title = coalesce(facebook_cta_title, 'Join the community'),
  facebook_cta_text = coalesce(facebook_cta_text, 'Have an event, photo, recommendation or question about Bansko? Share it with the Bansko NOW community.'),
  facebook_cta_button_label = coalesce(facebook_cta_button_label, 'Open the Facebook group'),
  art_studio_block_eyebrow = coalesce(art_studio_block_eyebrow, 'Bansko NOW Art Studio'),
  art_studio_block_title = coalesce(art_studio_block_title, 'Visual services with character'),
  art_studio_block_text = coalesce(art_studio_block_text, 'Photography, fine art printing, canvas and visual solutions inspired by Bansko and Pirin.'),
  art_studio_block_button_label = coalesce(art_studio_block_button_label, 'View Art Studio'),
  collection_block_eyebrow = coalesce(collection_block_eyebrow, 'Inspired by Bansko'),
  collection_block_title = coalesce(collection_block_title, 'Bansko Collection'),
  collection_block_text = coalesce(collection_block_text, 'Original products for people who want to take a part of Bansko with them.'),
  collection_block_button_label = coalesce(collection_block_button_label, 'Explore the collection'),
  collection_items = coalesce(collection_items, array['T-shirts', 'Mugs', 'Posters', 'Photo prints'])
where locale = 'en';
