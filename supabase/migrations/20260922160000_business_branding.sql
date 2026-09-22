-- Брандиране на бизнеса: една тема (цветове, шрифтове, лого, орнамент) за
-- собствените му изгледи - QR менюто, телевизора и печата. Профилът в
-- Bansko NOW не я ползва. Стойностите се пазят като jsonb в настройките на
-- платформата; кодът (src/lib/business-platform/theme.ts) ги валидира при
-- четене, така че произволен запис никога не стига до стиловете.
alter table public.business_platform_settings
  add column if not exists branding jsonb not null default '{}'::jsonb;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.business_platform_settings'::regclass
      and conname = 'business_platform_settings_branding_is_object'
  ) then
    alter table public.business_platform_settings
      add constraint business_platform_settings_branding_is_object
      check (jsonb_typeof(branding) = 'object');
  end if;
end $$;

-- Смяната на темата също вдига версията: телевизорите проверяват нея и се
-- презареждат, за да вземат новите цветове и логото.
create or replace function public.bump_platform_settings_version()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.open_override is distinct from old.open_override
     or new.branding is distinct from old.branding
  then
    new.content_version := old.content_version + 1;
  end if;
  return new;
end;
$$;

-- Телевизорът получава темата и логото заедно с екрана (той не пипа Supabase
-- директно). Логото се дава само ако е реален ред от вида 'logo' на същия бизнес.
create or replace function public.display_by_token(p_token text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
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
$$;

revoke execute on function public.display_by_token(text) from public;
grant execute on function public.display_by_token(text) to anon, authenticated;
