-- Business Platform · стъпка 5: демо екран за тестовия бизнес „Old Town Coffee“,
-- за да има какво да се види на /display/<token> и в портала още преди
-- собственикът да е създал свой. Идемпотентно; истинското кафе си създава
-- екраните от портала.
insert into public.business_displays (business_id, name, token, template, theme)
values ('5be5ae6e-d472-4e2d-a962-a1b98935261a', 'Ляв телевизор (демо)', 'demo-display-oldtown-3f9a2c7b1e', 'menu_only', 'dark')
on conflict (token) do nothing;

insert into public.business_display_categories (display_id, category_id, business_id, sort_order)
select d.id, c.id, c.business_id, row_number() over (order by c.sort_order) * 10
from public.business_displays d
join public.business_menu_categories c on c.business_id = d.business_id
where d.token = 'demo-display-oldtown-3f9a2c7b1e'
on conflict do nothing;
