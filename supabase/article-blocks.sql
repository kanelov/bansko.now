-- HTML blocks shown under articles and on the main public pages (Art Studio, Bansko Collection,
-- Facebook community, custom ones). Edited in /admin/blocks; rendered by src/lib/article-blocks.ts.
-- Rows are optional: keys missing here fall back to the defaults in code. Additive and idempotent.

create table if not exists public.article_blocks (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  title text not null,
  html_bg text not null default '',
  html_en text not null default '',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  article_toggle text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_article_blocks_updated_at on public.article_blocks;
create trigger set_article_blocks_updated_at
  before update on public.article_blocks
  for each row execute function public.set_updated_at();

alter table public.article_blocks enable row level security;

drop policy if exists "Active blocks are public" on public.article_blocks;
create policy "Active blocks are public" on public.article_blocks
for select to anon, authenticated using (is_active);

drop policy if exists "Admins manage blocks" on public.article_blocks;
create policy "Admins manage blocks" on public.article_blocks
for all to authenticated using (true) with check (true);

grant select on public.article_blocks to anon, authenticated;
grant select, insert, update, delete on public.article_blocks to authenticated;
