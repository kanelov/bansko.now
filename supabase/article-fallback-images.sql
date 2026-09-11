-- Default images for articles that have no featured image of their own.
-- The public pages pick the closest one by keywords (see src/lib/fallback-images.ts);
-- nothing is stored on the article, so replacing a picture here changes every article that uses it.
-- Additive and idempotent. Apply to project rzjyawjdhcedddydmfge.

create table if not exists public.article_fallback_images (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  title text not null,
  title_en text,
  keywords text[] not null default '{}',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists article_fallback_images_active_idx
  on public.article_fallback_images (is_active, sort_order);

drop trigger if exists set_article_fallback_images_updated_at on public.article_fallback_images;
create trigger set_article_fallback_images_updated_at
  before update on public.article_fallback_images
  for each row execute function public.set_updated_at();

alter table public.article_fallback_images enable row level security;

drop policy if exists "Active fallback images are public" on public.article_fallback_images;
create policy "Active fallback images are public" on public.article_fallback_images
for select to anon, authenticated using (is_active);

drop policy if exists "Admins manage fallback images" on public.article_fallback_images;
create policy "Admins manage fallback images" on public.article_fallback_images
for all to authenticated using (true) with check (true);

grant select on public.article_fallback_images to anon, authenticated;
grant select, insert, update, delete on public.article_fallback_images to authenticated;
