-- Editable texts for the photo archive (/photos, the photo pages, the license form).
-- Overrides over the defaults in src/lib/photo-copy.ts, edited in Admin → Фотоархив → „Текстове и лицензи“.
-- Additive and idempotent; safe to run again.

create table if not exists public.photo_public_settings (
  id uuid primary key default gen_random_uuid(),
  page_copy jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.photo_public_settings is
  'Single row with the editable photo archive texts: page_copy = { bg: {...}, en: {...} } (see src/lib/photo-copy.ts).';

-- One row only.
create unique index if not exists photo_public_settings_singleton_idx
  on public.photo_public_settings ((true));

drop trigger if exists trg_photo_public_settings_updated_at on public.photo_public_settings;
create trigger trg_photo_public_settings_updated_at before update on public.photo_public_settings
for each row execute function public.set_photo_updated_at();

alter table public.photo_public_settings enable row level security;

drop policy if exists "Photo settings are public" on public.photo_public_settings;
create policy "Photo settings are public" on public.photo_public_settings
for select to anon, authenticated using (true);

drop policy if exists "Admins manage photo settings" on public.photo_public_settings;
create policy "Admins manage photo settings" on public.photo_public_settings
for all to authenticated using (true) with check (true);

grant select on public.photo_public_settings to anon, authenticated;
grant select, insert, update, delete on public.photo_public_settings to authenticated;

insert into public.photo_public_settings (page_copy)
select '{}'::jsonb
where not exists (select 1 from public.photo_public_settings);

-- The Bulgarian license text was seeded with a misspelt author name. Fix it in place and
-- bump the terms version; paid orders keep the snapshot they were sold with.
update public.photo_license_types
set terms_bg = replace(terms_bg, 'Лубо Кънелов', 'Любо Канелов'),
    terms_version = terms_version + 1
where terms_bg like '%Лубо Кънелов%';
