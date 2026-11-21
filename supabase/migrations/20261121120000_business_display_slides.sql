-- Шаблон „Слайдове“ за телевизорите (2026-11-21): екран, който върти снимки и
-- видеа на цял екран, с заглавие и подзаглавие. Първо за Галерия TDR.
-- Добавъчна и идемпотентна. Телевизорът чете слайдовете само през
-- display_by_token (security definer), затова таблицата няма анонимна политика.

-- 1) Нов шаблон
alter table public.business_displays drop constraint if exists business_displays_template_check;
alter table public.business_displays add constraint business_displays_template_check
  check (template = any (array['menu_only', 'menu_image', 'menu_video', 'slides']));

-- 2) Слайдовете
create table if not exists public.business_display_slides (
  id uuid primary key default gen_random_uuid(),
  display_id uuid not null references public.business_displays(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  media_id uuid not null references public.business_media(id) on delete cascade,
  title text not null default '' check (char_length(title) <= 80),
  subtitle text not null default '' check (char_length(subtitle) <= 160),
  duration_seconds integer not null default 10 check (duration_seconds between 3 and 120),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists business_display_slides_display_idx on public.business_display_slides (display_id, sort_order);
create index if not exists business_display_slides_business_idx on public.business_display_slides (business_id);
create index if not exists business_display_slides_media_idx on public.business_display_slides (media_id);

alter table public.business_display_slides enable row level security;

drop policy if exists "Members read display slides" on public.business_display_slides;
create policy "Members read display slides" on public.business_display_slides
  for select to authenticated
  using ((business_id in (select public.member_business_ids())) or (select public.is_admin()));

drop policy if exists "Owners add display slides" on public.business_display_slides;
create policy "Owners add display slides" on public.business_display_slides
  for insert to authenticated
  with check ((select public.is_business_owner(business_id)) or (select public.is_admin()));

drop policy if exists "Owners update display slides" on public.business_display_slides;
create policy "Owners update display slides" on public.business_display_slides
  for update to authenticated
  using ((select public.is_business_owner(business_id)) or (select public.is_admin()))
  with check ((select public.is_business_owner(business_id)) or (select public.is_admin()));

drop policy if exists "Owners delete display slides" on public.business_display_slides;
create policy "Owners delete display slides" on public.business_display_slides
  for delete to authenticated
  using ((select public.is_business_owner(business_id)) or (select public.is_admin()));

grant select, insert, update, delete on public.business_display_slides to authenticated;
revoke all on public.business_display_slides from anon;

-- Промяна в слайдовете вдига версията, телевизорът се презарежда сам.
drop trigger if exists bump_content_version on public.business_display_slides;
create trigger bump_content_version
  after insert or update or delete on public.business_display_slides
  for each row execute function public.bump_business_content_version();

-- 3) Телевизорът получава и слайдовете
create or replace function public.display_by_token(p_token text)
 returns jsonb
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  select jsonb_build_object(
    'id', d.id,
    'business_id', d.business_id,
    'business_name', b.name,
    'name', d.name,
    'template', d.template,
    'theme', d.theme,
    'show_descriptions', d.show_descriptions,
    'updated_at', d.updated_at,
    'content_version', s.content_version,
    'branding', s.branding,
    'category_ids', coalesce((
      select jsonb_agg(dc.category_id order by dc.sort_order)
      from public.business_display_categories dc
      where dc.display_id = d.id
    ), '[]'::jsonb),
    'media', (
      select jsonb_build_object(
        'media_type', m.media_type,
        'original_key', m.original_key,
        'variant_keys', m.variant_keys,
        'alt', m.alt
      )
      from public.business_media m
      where m.id = d.media_id
    ),
    'slides', coalesce((
      select jsonb_agg(jsonb_build_object(
        'media_type', m.media_type,
        'original_key', m.original_key,
        'variant_keys', m.variant_keys,
        'alt', m.alt,
        'title', sl.title,
        'subtitle', sl.subtitle,
        'duration', sl.duration_seconds
      ) order by sl.sort_order, sl.created_at)
      from public.business_display_slides sl
      join public.business_media m on m.id = sl.media_id and m.business_id = sl.business_id
      where sl.display_id = d.id
    ), '[]'::jsonb),
    'logo', (
      select jsonb_build_object(
        'original_key', m.original_key,
        'variant_keys', m.variant_keys,
        'alt', m.alt
      )
      from public.business_media m
      where m.business_id = d.business_id
        and m.kind = 'logo'
        and m.media_type = 'image'
        and m.id::text = s.branding->>'logo_media_id'
      limit 1
    )
  )
  from public.business_displays d
  join public.businesses b on b.id = d.business_id
  join public.business_platform_settings s on s.business_id = d.business_id
  where d.token = p_token
    and d.is_active
    and length(p_token) between 16 and 64
    and d.business_id in (select public.public_business_ids('displays'))
  limit 1;
$function$;
