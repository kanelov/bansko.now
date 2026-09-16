-- Business Platform · права върху помощните функции (по security advisor).
-- Тригерната функция не се вика през REST; функциите за портала не се викат от anon.
-- member_business_ids() и public_business_ids() остават достъпни за anon нарочно:
-- участват в политики, които важат и за анонимни четения, и връщат само
-- членствата на самия потребител / публично видимите бизнеси.
revoke execute on function public.bump_business_content_version() from public, anon, authenticated;
revoke execute on function public.business_role(uuid) from public, anon;
revoke execute on function public.is_business_owner(uuid) from public, anon;
