-- Business Platform · стъпка 1: затваряне на анонимното качване.
-- Политиката пускаше всеки с публичния anon ключ да качва файлове в bucket
-- business-images, независимо от формата на сайта. Формата за нов бизнес
-- (src/app/(site)/[locale]/businesses/actions.ts) качва през service role
-- от сървъра, след като сама е проверила тип и размер.
drop policy if exists "Public can upload validated business images" on storage.objects;
