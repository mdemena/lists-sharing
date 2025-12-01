-- Add user_id column to list_shares
alter table public.list_shares
add column user_id uuid references auth.users(id) on delete cascade;

-- Update RLS policies to allow users to view shares where they are the target user
create policy "Users can view shares assigned to them"
  on public.list_shares for select
  using (
    user_id = auth.uid()
  );

-- Also allow users to update their own share record (e.g. to accept/reject, though currently we just auto-register)
create policy "Users can update their own share"
  on public.list_shares for update
  using (
    user_id = auth.uid()
  );
