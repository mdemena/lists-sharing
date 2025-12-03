-- Sync display_name between auth.users and public.profiles

-- 1. Backfill display_name from auth.users for existing profiles
UPDATE public.profiles p
SET display_name = COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', u.email)
FROM auth.users u
WHERE p.id = u.id
AND (p.display_name IS NULL OR p.display_name = '');

-- 2. Update handle_new_user to extract name from metadata on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    new.id, 
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', new.email)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger: Auth -> Profile
-- When auth.users is updated (e.g. metadata changes), update profile
CREATE OR REPLACE FUNCTION public.sync_auth_to_profile()
RETURNS trigger AS $$
BEGIN
  -- Only update if metadata changed and contains a name
  IF (new.raw_user_meta_data->>'full_name' IS DISTINCT FROM old.raw_user_meta_data->>'full_name') OR
     (new.raw_user_meta_data->>'name' IS DISTINCT FROM old.raw_user_meta_data->>'name') THEN
     
     UPDATE public.profiles
     SET display_name = COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name')
     WHERE id = new.id;
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to avoid errors on re-run
DROP TRIGGER IF EXISTS on_auth_user_update ON auth.users;
CREATE TRIGGER on_auth_user_update
AFTER UPDATE ON auth.users
FOR EACH ROW
EXECUTE PROCEDURE public.sync_auth_to_profile();

-- 4. Trigger: Profile -> Auth
-- When profile is updated, update auth metadata
CREATE OR REPLACE FUNCTION public.sync_profile_to_auth()
RETURNS trigger AS $$
BEGIN
  -- Only update if display_name changed
  IF new.display_name IS DISTINCT FROM old.display_name THEN
    UPDATE auth.users
    SET raw_user_meta_data = 
      COALESCE(raw_user_meta_data, '{}'::jsonb) || 
      jsonb_build_object('full_name', new.display_name)
    WHERE id = new.id;
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS on_profile_update ON public.profiles;
CREATE TRIGGER on_profile_update
AFTER UPDATE ON public.profiles
FOR EACH ROW
EXECUTE PROCEDURE public.sync_profile_to_auth();
