-- HTML слайдове на екраните (2026-11-21): освен снимка или видео, слайдът може
-- да е готова HTML страница (банер/анимация, направени например с Claude).
-- Телевизорът я показва в <iframe sandbox="allow-scripts" srcdoc>, т.е. в
-- затворен произход без достъп до bansko.now. Добавъчна и идемпотентна.

alter table public.business_display_slides add column if not exists kind text not null default 'media';
alter table public.business_display_slides add column if not exists html text;
alter table public.business_display_slides alter column media_id drop not null;

alter table public.business_display_slides drop constraint if exists business_display_slides_kind_check;
alter table public.business_display_slides add constraint business_display_slides_kind_check check (
  (kind = 'media' and media_id is not null and html is null)
  or (kind = 'html' and media_id is null and html is not null and char_length(html) between 1 and 200000)
);

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
        'kind', sl.kind,
        'html', sl.html,
        'media_type', m.media_type,
        'original_key', m.original_key,
        'variant_keys', m.variant_keys,
        'alt', m.alt,
        'title', sl.title,
        'subtitle', sl.subtitle,
        'duration', sl.duration_seconds
      ) order by sl.sort_order, sl.created_at)
      from public.business_display_slides sl
      left join public.business_media m on m.id = sl.media_id and m.business_id = sl.business_id
      where sl.display_id = d.id
        and (sl.kind = 'html' or m.id is not null)
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
