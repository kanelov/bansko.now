-- Business Platform · стъпка 4: каталогът на бизнесите се казва /places.
-- Менюто на сайта сочи направо към новия адрес, за да не минава през редирект.
update public.navigation_items
set href = '/places'
where href = '/businesses';

update public.navigation_items
set href = replace(href, '/businesses/', '/places/')
where href like '/businesses/%';
