-- Ensure authenticated active admins can read/create/update brands without
-- weakening the existing public active-brand read policy. Safe to re-run.
-- This migration does not add columns or change existing brand data.

begin;

alter table if exists public.brands enable row level security;
grant select, insert, update on public.brands to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'brands'
      and policyname = 'Active admins can read all brands'
  ) then
    create policy "Active admins can read all brands"
    on public.brands for select to authenticated
    using (exists (
      select 1 from public.admin_users
      where admin_users.user_id = (select auth.uid())
        and admin_users.role = 'admin' and admin_users.is_active = true
    ));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'brands'
      and policyname = 'Active admins can create brands'
  ) then
    create policy "Active admins can create brands"
    on public.brands for insert to authenticated
    with check (exists (
      select 1 from public.admin_users
      where admin_users.user_id = (select auth.uid())
        and admin_users.role = 'admin' and admin_users.is_active = true
    ));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'brands'
      and policyname = 'Active admins can update brands'
  ) then
    create policy "Active admins can update brands"
    on public.brands for update to authenticated
    using (exists (
      select 1 from public.admin_users
      where admin_users.user_id = (select auth.uid())
        and admin_users.role = 'admin' and admin_users.is_active = true
    ))
    with check (exists (
      select 1 from public.admin_users
      where admin_users.user_id = (select auth.uid())
        and admin_users.role = 'admin' and admin_users.is_active = true
    ));
  end if;
end;
$$;

commit;
