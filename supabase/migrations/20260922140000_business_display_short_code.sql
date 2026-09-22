-- Къс адрес за телевизора: bansko.now/tv/<5 знака> пренасочва към /display/<token>.
-- На телевизор се пише трудно; дългият token остава тайният адрес, късият код е само вход към него.
alter table public.business_displays add column if not exists short_code text;
create unique index if not exists business_displays_short_code_key on public.business_displays (short_code);

-- Токенът по къс код, само за активен екран на активен бизнес с включен модул.
create or replace function public.display_token_by_code(p_code text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select d.token
  from public.business_displays d
  where d.short_code = lower(p_code)
    and d.is_active
    and length(p_code) between 4 and 12
    and d.business_id in (select public.public_business_ids('displays'))
  limit 1;
$$;

revoke all on function public.display_token_by_code(text) from public;
grant execute on function public.display_token_by_code(text) to anon, authenticated, service_role;

-- Кодове за вече създадените екрани (азбука без объркващи знаци).
do $$
declare r record; code text; tries int;
begin
  for r in select id from public.business_displays where short_code is null loop
    tries := 0;
    loop
      code := (select string_agg(substr('abcdefghjkmnpqrstuvwxyz23456789', 1 + floor(random() * 31)::int, 1), '') from generate_series(1, 5));
      begin
        update public.business_displays set short_code = code where id = r.id;
        exit;
      exception when unique_violation then
        tries := tries + 1;
        if tries > 20 then raise; end if;
      end;
    end loop;
  end loop;
end $$;
