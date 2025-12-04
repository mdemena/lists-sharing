-- Enable RLS on list_items if not already enabled (idempotent operation usually, but good practice to ensure)
alter table public.list_items enable row level security;

-- Create policy to allow users to update items in lists shared with them
create policy "Users can update items in lists shared with them"
  on public.list_items for update
  using (
    exists (
      select 1 from list_shares
      where list_shares.list_id = list_items.list_id
      and list_shares.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from list_shares
      where list_shares.list_id = list_items.list_id
      and list_shares.user_id = auth.uid()
    )
  );
