-- Business Platform · стъпка 7: ограничаване на опитите за вход (/business/login
-- и /admin/login). Входът минава през сървъра на Vercel, затова вграденото
-- ограничение на Supabase „по IP“ вижда само адреса на Vercel. Тук се броят
-- опитите по отпечатък (SHA-256) на имейла и на адреса на посетителя - самите
-- имейл и IP не се пазят никъде.
--
-- Граници за 15 минути: 8 опита за двойката имейл+адрес, 30 за един имейл,
-- 60 от един адрес. Надхвърли ли се някоя, функцията връща false и опитът не
-- стига до Supabase Auth. Всичко е добавящо и идемпотентно.

create table if not exists public.auth_login_attempts (
  id bigint generated always as identity primary key,
  scope text not null check (scope in ('pair', 'email', 'ip')),
  key_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists auth_login_attempts_key_idx on public.auth_login_attempts (scope, key_hash, created_at);

-- RLS без нито една политика: таблицата не се чете и не се пише през REST.
alter table public.auth_login_attempts enable row level security;

create or replace function public.register_login_attempt(p_email_hash text, p_ip_hash text)
returns boolean
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_pair text;
  v_since timestamptz := now() - interval '15 minutes';
begin
  if p_email_hash !~ '^[0-9a-f]{64}$' or p_ip_hash !~ '^[0-9a-f]{64}$' then
    return false;
  end if;

  v_pair := md5(p_email_hash || p_ip_hash);

  -- Старите редове се чистят от време на време, не при всеки опит.
  if random() < 0.05 then
    delete from public.auth_login_attempts where created_at < now() - interval '1 day';
  end if;

  if (select count(*) from public.auth_login_attempts where scope = 'pair' and key_hash = v_pair and created_at > v_since) >= 8
     or (select count(*) from public.auth_login_attempts where scope = 'email' and key_hash = p_email_hash and created_at > v_since) >= 30
     or (select count(*) from public.auth_login_attempts where scope = 'ip' and key_hash = p_ip_hash and created_at > v_since) >= 60 then
    return false;
  end if;

  insert into public.auth_login_attempts (scope, key_hash)
  values ('pair', v_pair), ('email', p_email_hash), ('ip', p_ip_hash);

  return true;
end;
$$;

revoke execute on function public.register_login_attempt(text, text) from public;
grant execute on function public.register_login_attempt(text, text) to anon, authenticated;
