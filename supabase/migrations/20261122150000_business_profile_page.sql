-- Страница на бизнеса (2026-11-22):
--  * собствена HTML част за всяка страница (`business_translations.custom_html`, по език),
--    писана от Bansko NOW в стила на сайта; собственикът не я пипа;
--  * собственикът редактира профила си от портала, затова категорията и името на категорията
--    стават само за администратора (както slug, премиум статус и одобрение).
-- Добавъчна и идемпотентна.

alter table public.business_translations add column if not exists custom_html text;

alter table public.business_translations drop constraint if exists business_translations_custom_html_length;
alter table public.business_translations add constraint business_translations_custom_html_length
  check (custom_html is null or char_length(custom_html) <= 60000);

create or replace function public.guard_business_translation_columns()
 returns trigger
 language plpgsql
 set search_path to 'public'
as $function$
begin
  if (select public.is_privileged_session()) then
    return new;
  end if;

  /* Нов превод от собственика не може да носи HTML част. */
  if tg_op = 'INSERT' then
    new.custom_html := null;
    return new;
  end if;

  if new.business_id is distinct from old.business_id
     or new.locale is distinct from old.locale
     or new.slug is distinct from old.slug
     or new.category is distinct from old.category
     or new.custom_html is distinct from old.custom_html
     or new.canonical_url is distinct from old.canonical_url
     or new.robots_index is distinct from old.robots_index
     or new.robots_follow is distinct from old.robots_follow
     or new.schema_type is distinct from old.schema_type
  then
    raise exception 'Адресът, категорията, HTML частта и индексирането се променят само от администратор' using errcode = '42501';
  end if;

  return new;
end;
$function$;

drop trigger if exists guard_business_translation_columns on public.business_translations;
create trigger guard_business_translation_columns
  before insert or update on public.business_translations
  for each row execute function public.guard_business_translation_columns();

create or replace function public.guard_business_admin_columns()
 returns trigger
 language plpgsql
 set search_path to 'public'
as $function$
begin
  if (select public.is_privileged_session()) then
    return new;
  end if;

  if new.slug is distinct from old.slug
     or new.status is distinct from old.status
     or new.category is distinct from old.category
     or new.category_id is distinct from old.category_id
     or new.listing_tier is distinct from old.listing_tier
     or new.requested_plan_id is distinct from old.requested_plan_id
     or new.active_plan_id is distinct from old.active_plan_id
     or new.payment_status is distinct from old.payment_status
     or new.paid_until is distinct from old.paid_until
     or new.is_homepage_spotlight is distinct from old.is_homepage_spotlight
     or new.homepage_spotlight_until is distinct from old.homepage_spotlight_until
     or new.priority is distinct from old.priority
     or new.map_pin_x is distinct from old.map_pin_x
     or new.map_pin_y is distinct from old.map_pin_y
     or new.show_on_illustrated_map is distinct from old.show_on_illustrated_map
     or new.requested_services is distinct from old.requested_services
     or new.admin_notes is distinct from old.admin_notes
     or new.canonical_url is distinct from old.canonical_url
     or new.robots_index is distinct from old.robots_index
     or new.robots_follow is distinct from old.robots_follow
     or new.schema_type is distinct from old.schema_type
  then
    raise exception 'Това поле се променя само от администратор' using errcode = '42501';
  end if;

  return new;
end;
$function$;
