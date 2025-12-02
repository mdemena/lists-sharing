-- Add RLS policy to allow users to view lists shared with them
-- This ensures that when a user is in list_shares with their user_id,
-- they can view the corresponding list details

create policy "Users can view lists shared with them"
  on public.lists for select
  using (
    exists (
      select 1 from public.list_shares
      where list_shares.list_id = lists.id
      and list_shares.user_id = auth.uid()
    )
  );
