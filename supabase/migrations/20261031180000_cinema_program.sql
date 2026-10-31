-- Кино програма на Арена Банско за блока на началната страница.
-- Един ред на кино: цялата седмица е в jsonb (само факти: заглавие, дата, час, зала, формат, възраст, продължителност).
-- Пише само сървърът (service role през /api/cron/cinema); анонимните четат.
create table if not exists public.cinema_programs (
  id text primary key,
  cinema_name text not null,
  source_url text not null,
  tickets_url text not null,
  screenings jsonb not null default '[]'::jsonb,
  fetched_at timestamptz,
  fetch_ok boolean not null default false,
  fetch_error text,
  updated_at timestamptz not null default now(),
  constraint cinema_programs_screenings_array check (jsonb_typeof(screenings) = 'array')
);

alter table public.cinema_programs enable row level security;

drop policy if exists "cinema_programs_public_read" on public.cinema_programs;
create policy "cinema_programs_public_read" on public.cinema_programs
  for select to anon, authenticated using (true);

-- Правата по подразбиране в public дават INSERT/UPDATE/DELETE/TRUNCATE на anon/authenticated; RLS без политики за писане ги спира,
-- но махаме и самите права, за да е ясно.
revoke insert, update, delete, truncate on public.cinema_programs from anon, authenticated;

insert into public.cinema_programs (id, cinema_name, source_url, tickets_url)
values ('arena-bansko', 'Кино Арена Банско', 'https://www.kinoarena.com/bg/program/view/arena-bansko', 'https://www.kinoarena.com/bg/program/view/arena-bansko')
on conflict (id) do nothing;

comment on table public.cinema_programs is 'Седмична програма на кино (Арена Банско), взета от официалния сайт от /api/cron/cinema.';
