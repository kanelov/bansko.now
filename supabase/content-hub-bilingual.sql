-- A Content Hub item may now publish a Bulgarian and an English article at once.
-- The pair shares translation_group_id, so the language switch and hreflang work,
-- and the item id becomes unique per locale instead of per item.
drop index if exists public.articles_content_hub_item_uidx;

create unique index if not exists articles_content_hub_item_locale_uidx
  on public.articles (content_hub_item_id, locale)
  where content_hub_item_id is not null;

comment on column public.articles.content_hub_item_id is
  'Content Hub item that produced this article; the same id may exist once per locale';
