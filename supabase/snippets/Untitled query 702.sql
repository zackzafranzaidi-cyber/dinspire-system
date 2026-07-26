ALTER TABLE public.branches ADD COLUMN lat numeric;
ALTER TABLE public.branches ADD COLUMN lng numeric;

-- Segarkan semula memori Supabase supaya ia sedar ruangan ini wujud
NOTIFY pgrst, 'reload schema';