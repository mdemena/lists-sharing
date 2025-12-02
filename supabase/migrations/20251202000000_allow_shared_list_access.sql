-- Drop the problematic policy if it exists
drop policy if exists "Users can view lists shared with them" on public.lists;

-- Create a function to check if user has access to a list via list_shares
-- Using security definer to avoid recursion
create or replace function user_has_list_share_access(list_id_param uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return exists (
    select 1 from list_shares
    where list_id = list_id_param
    and user_id = auth.uid()
  );
end;
$$;

-- Now create the policy using the function
create policy "Users can view lists shared with them"
  on public.lists for select
  using (user_has_list_share_access(id));
