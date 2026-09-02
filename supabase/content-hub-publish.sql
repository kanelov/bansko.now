-- Content Hub publish endpoint support (POST /api/content/publish).
-- Additive and idempotent. Apply in the Supabase SQL Editor of the Bansko NOW project (rzjyawjdhcedddydmfge).
-- The article body, SEO fields and images keep using the existing columns; this only links an article
-- to the Content Hub item that created it so a re-publish updates the same record instead of duplicating it.

alter table public.articles
  add column if not exists content_hub_item_id uuid;

create unique index if not exists articles_content_hub_item_uidx
  on public.articles (content_hub_item_id)
  where content_hub_item_id is not null;

comment on column public.articles.content_hub_item_id is
  'Content Hub (request app) item that created or last updated this article. One article per item.';

notify pgrst, 'reload schema';

select
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'articles'
      and column_name = 'content_hub_item_id'
  ) as column_ready,
  to_regclass('public.articles_content_hub_item_uidx') as unique_index;
