-- Fix list_shares relationships to reference profiles instead of auth.users
-- This is necessary because the API tries to join list_shares with profiles

-- 0. PRE-FLIGHT CHECK: Fix data inconsistencies
-- The previous attempt failed because some shared_by/user_id values in list_shares
-- did not have corresponding records in the profiles table.

DO $$
BEGIN
    -- 1. Backfill profiles for users that exist in auth.users but missing in profiles
    -- This handles cases where the trigger might have missed or users created before profiles table
    INSERT INTO public.profiles (id)
    SELECT DISTINCT ls.shared_by
    FROM public.list_shares ls
    JOIN auth.users u ON ls.shared_by = u.id
    WHERE ls.shared_by IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = ls.shared_by)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.profiles (id)
    SELECT DISTINCT ls.user_id
    FROM public.list_shares ls
    JOIN auth.users u ON ls.user_id = u.id
    WHERE ls.user_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = ls.user_id)
    ON CONFLICT (id) DO NOTHING;

    -- 2. Clean up references to users that don't exist in auth.users (and thus can't be in profiles)
    -- We set them to NULL to avoid FK violations.
    UPDATE public.list_shares
    SET shared_by = NULL
    WHERE shared_by IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = list_shares.shared_by);

    UPDATE public.list_shares
    SET user_id = NULL
    WHERE user_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = list_shares.user_id);

END $$;

-- 1. Drop existing foreign keys (names might vary, so we try to drop by constraint name if known, or just alter column)
DO $$
BEGIN
    -- Try to drop the constraint for shared_by
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'list_shares_shared_by_fkey') THEN
        ALTER TABLE public.list_shares DROP CONSTRAINT list_shares_shared_by_fkey;
    END IF;
    
    -- Try to drop the constraint for user_id
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'list_shares_user_id_fkey') THEN
        ALTER TABLE public.list_shares DROP CONSTRAINT list_shares_user_id_fkey;
    END IF;
END $$;

-- 2. Add new foreign keys referencing public.profiles
-- We explicitly name them to match what the API might expect or standard naming.
-- The API uses `profiles!list_shares_shared_by_fkey`, so we MUST name the shared_by constraint `list_shares_shared_by_fkey`.

ALTER TABLE public.list_shares
ADD CONSTRAINT list_shares_shared_by_fkey
FOREIGN KEY (shared_by)
REFERENCES public.profiles(id)
ON DELETE SET NULL;

ALTER TABLE public.list_shares
ADD CONSTRAINT list_shares_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;
