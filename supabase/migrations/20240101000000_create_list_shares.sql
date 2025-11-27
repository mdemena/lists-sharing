-- Create list_shares table
create table if not exists public.list_shares (
  id uuid default gen_random_uuid() primary key,
  list_id uuid references public.lists(id) on delete cascade not null,
  email text not null,
  shared_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(list_id, email)
);

-- Enable RLS
alter table public.list_shares enable row level security;

-- Policies for list_shares
-- Allow users to view shares for lists they own or are shared with (simplified for now: if you can view the list, you can view shares? Or maybe just owners?)
-- Let's assume for now only owners can see who they shared with, or maybe everyone with access.
-- Given the requirement "registrada con quien la ha compartido", it implies the owner wants to see.
create policy "Users can view shares for lists they own"
  on public.list_shares for select
  using (
    exists (
      select 1 from public.lists
      where lists.id = list_shares.list_id
      and lists.owner_id = auth.uid()
    )
  );

create policy "Users can insert shares for lists they own"
  on public.list_shares for insert
  with check (
    exists (
      select 1 from public.lists
      where lists.id = list_shares.list_id
      and lists.owner_id = auth.uid()
    )
  );

-- Function to get shares with registration status
create or replace function get_list_shares_with_status(p_list_id uuid)
returns table (
  email text,
  is_registered boolean
)
language plpgsql
security definer
as $$
begin
  return query
  select
    ls.email,
    exists (
      select 1 from auth.users u where u.email = ls.email
    ) as is_registered
  from
    public.list_shares ls
  where
    ls.list_id = p_list_id;
end;
$$;
