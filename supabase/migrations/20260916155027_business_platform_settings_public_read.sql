-- Business Platform · стъпка 4: публичните страници (QR меню, профил, екрани)
-- четат open_override и content_version на активните бизнеси с anon ключа.
-- Отделна политика за anon: съществуващата е само за authenticated (членове/админ).
drop policy if exists "Platform settings of active businesses are public" on public.business_platform_settings;
create policy "Platform settings of active businesses are public"
  on public.business_platform_settings for select to anon
  using (business_id in (select public.active_business_ids()));
