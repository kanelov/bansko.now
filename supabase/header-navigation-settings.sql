alter table public.site_settings
  add column if not exists logo_image_url text,
  add column if not exists logo_image_alt text default 'Bansko NOW';

update public.site_settings
set logo_image_alt = coalesce(nullif(logo_image_alt, ''), nullif(site_name, ''), 'Bansko NOW')
where logo_image_alt is null or logo_image_alt = '';
