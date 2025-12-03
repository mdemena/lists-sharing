-- Update RLS policies for profiles to allow viewing shared users

-- Policy: Users can view profiles of people who shared lists with them
CREATE POLICY "Users can view profiles of list sharers"
ON public.profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.list_shares ls
    WHERE ls.shared_by = profiles.id
    AND ls.user_id = auth.uid()
  )
);

-- Policy: Users can view profiles of people they shared lists with
CREATE POLICY "Users can view profiles of list recipients"
ON public.profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.list_shares ls
    WHERE ls.user_id = profiles.id
    AND ls.shared_by = auth.uid()
  )
);
