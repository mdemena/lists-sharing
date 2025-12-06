-- Add preferred_language to profiles
alter table public.profiles 
add column if not exists preferred_language text default 'es';
