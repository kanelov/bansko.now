-- Optional initial Art Studio product types. Run after art-studio-commerce-mvp.sql.
-- These rows contain only public catalog content and can be edited from the admin.

insert into public.art_studio_product_types (internal_name, icon_name, is_featured, is_active, sort_order)
values
  ('custom-tshirts', 'shirt', true, true, 10),
  ('fine-art-prints', 'image', true, true, 20),
  ('mugs-drinkware', 'mug-hot', false, true, 30),
  ('icons', 'church', false, true, 40)
on conflict (internal_name) do update set
  icon_name = excluded.icon_name,
  is_featured = excluded.is_featured,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order;

insert into public.art_studio_product_type_translations (
  product_type_id, locale, title, slug, description, image_alt, seo_title, seo_description
)
select product_type.id, translation.locale, translation.title, translation.slug, translation.description, translation.image_alt, translation.seo_title, translation.seo_description
from public.art_studio_product_types product_type
join (values
  ('custom-tshirts', 'bg', 'Тениски по поръчка', 'teniski-po-porachka', 'Авторски тениски с дизайн, име или кратък текст по желание.', 'Тениски по поръчка от Bansko NOW Art Studio', 'Тениски по поръчка в Банско | Art Studio', 'Авторски тениски с дизайн и персонален текст, създадени в Банско.'),
  ('custom-tshirts', 'en', 'Custom T-shirts', 'custom-tshirts', 'Original T-shirts with an optional name or short text.', 'Custom T-shirts by Bansko NOW Art Studio', 'Custom T-shirts in Bansko | Art Studio', 'Original T-shirts with optional personalised text, made in Bansko.'),
  ('fine-art-prints', 'bg', 'Fine Art принтове', 'fine-art-printove', 'Фотографии и авторски изображения върху висококачествена хартия или платно.', 'Fine Art принтове от Банско и Пирин', 'Fine Art принтове в Банско | Art Studio', 'Фотографии и авторски изображения от Банско и Пирин върху качествена хартия или платно.'),
  ('fine-art-prints', 'en', 'Fine Art Prints', 'fine-art-prints', 'Photography and original artwork printed on quality paper or canvas.', 'Fine Art prints inspired by Bansko and Pirin', 'Fine Art Prints in Bansko | Art Studio', 'Photography and original artwork inspired by Bansko and Pirin, printed on quality paper or canvas.'),
  ('mugs-drinkware', 'bg', 'Чаши и термоси', 'chashi-i-termosi', 'Практични арт продукти с визуален характер, вдъхновен от Банско.', 'Авторски чаши и термоси от Банско', 'Чаши и термоси от Банско | Art Studio', 'Авторски чаши и термоси с дизайн, вдъхновен от Банско.'),
  ('mugs-drinkware', 'en', 'Mugs and Drinkware', 'mugs-and-drinkware', 'Practical art products with a visual character inspired by Bansko.', 'Original mugs and drinkware inspired by Bansko', 'Bansko Mugs and Drinkware | Art Studio', 'Original mugs and drinkware with designs inspired by Bansko.'),
  ('icons', 'bg', 'Икони', 'ikoni', 'Икони и духовни изображения, подготвени с внимание към материала и детайла.', 'Икони от Bansko NOW Art Studio', 'Икони и духовни изображения | Art Studio', 'Икони и духовни изображения, изработени с внимание към материала и детайла.'),
  ('icons', 'en', 'Icons', 'icons', 'Icons and sacred images prepared with care for material and detail.', 'Icons by Bansko NOW Art Studio', 'Icons and Sacred Images | Art Studio', 'Icons and sacred images made with care for material and detail.')
) as translation(internal_name, locale, title, slug, description, image_alt, seo_title, seo_description)
  on translation.internal_name = product_type.internal_name
on conflict (product_type_id, locale) do update set
  title = excluded.title,
  slug = excluded.slug,
  description = excluded.description,
  image_alt = excluded.image_alt,
  seo_title = excluded.seo_title,
  seo_description = excluded.seo_description;
