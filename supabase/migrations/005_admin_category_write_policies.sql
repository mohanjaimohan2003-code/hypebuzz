begin;

-- Category writes use the signed-in user's publishable-key client. PostgreSQL
-- privileges allow the operations, while RLS restricts them to active admins.
grant insert, update on public.categories to authenticated;

create policy "Active admins can create categories"
on public.categories for insert
to authenticated
with check (
  exists (
    select 1 from public.admin_users
    where admin_users.user_id = (select auth.uid())
      and admin_users.role = 'admin'
      and admin_users.is_active = true
  )
);

create policy "Active admins can update categories"
on public.categories for update
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

-- DELETE remains revoked and has no policy. Categories are disabled by setting
-- their existing is_active flag to false and can be re-enabled later.

commit;
