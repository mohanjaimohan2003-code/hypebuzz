begin;

-- Migration 003 already allows active admins to read all brands while the
-- public policy remains limited to active brands. Add write privileges only.
grant insert, update on public.brands to authenticated;

create policy "Active admins can create brands"
on public.brands for insert
to authenticated
with check (
  exists (
    select 1 from public.admin_users
    where admin_users.user_id = (select auth.uid())
      and admin_users.role = 'admin'
      and admin_users.is_active = true
  )
);

create policy "Active admins can update brands"
on public.brands for update
to authenticated
using (
  exists (
    select 1 from public.admin_users
    where admin_users.user_id = (select auth.uid())
      and admin_users.role = 'admin'
      and admin_users.is_active = true
  )
)
with check (
  exists (
    select 1 from public.admin_users
    where admin_users.user_id = (select auth.uid())
      and admin_users.role = 'admin'
      and admin_users.is_active = true
  )
);

-- DELETE remains revoked and has no policy. Brands are disabled by setting
-- is_active to false and can be re-enabled later.

commit;
