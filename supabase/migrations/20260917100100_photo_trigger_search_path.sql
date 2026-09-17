-- Втвърдяване: съветникът по сигурността сочи, че set_photo_updated_at() няма
-- закован search_path. Функцията е тригер за updated_at и не чете нищо, но
-- заковаваме пътя, за да не зависи от ролята, която я изпълнява.
alter function public.set_photo_updated_at() set search_path = public;
