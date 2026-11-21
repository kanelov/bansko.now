-- Номера вместо случаен код за телевизорите (2026-11-21, искане на собственика):
-- bansko.now/tv/001, /tv/002 … – пишат се лесно с дистанционно. Номерът е
-- поредно число, общо за всички бизнеси, и не се сменя при „Смени адреса“
-- (тогава се сменя само дългият таен адрес). Номерата са познаваеми: всеки
-- може да отвори чужд екран – приемливо, защото екраните показват публично
-- съдържание (меню, реклама).
-- Също: изтрит е екранът „Фреим тв галерия“ на Галерия TDR (по искане).

delete from public.business_displays where short_code = 'w6xnq';

create sequence if not exists public.business_display_number_seq;

update public.business_displays set short_code = '001' where short_code = 'qjq4u';
update public.business_displays set short_code = '002' where short_code = 'c7wva';

select setval('public.business_display_number_seq',
  greatest(2, coalesce((select max(short_code::int) from public.business_displays where short_code ~ '^[0-9]+$'), 0)));

/* Останалите (ако има) получават номер по реда на създаване. */
update public.business_displays d
set short_code = lpad(nextval('public.business_display_number_seq')::text, 3, '0')
where d.short_code is null or d.short_code !~ '^[0-9]+$';

alter table public.business_displays
  alter column short_code set default lpad(nextval('public.business_display_number_seq')::text, 3, '0');

grant usage, select on sequence public.business_display_number_seq to authenticated;

/* „1“, „01“ и „001“ водят до един и същ екран. */
create or replace function public.display_token_by_code(p_code text)
 returns text
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  select d.token
  from public.business_displays d
  where d.is_active
    and length(p_code) between 1 and 12
    and d.short_code = case
      when p_code ~ '^[0-9]{1,9}$' then lpad((p_code::bigint)::text, 3, '0')
      else lower(p_code)
    end
    and d.business_id in (select public.public_business_ids('displays'))
  limit 1;
$function$;
