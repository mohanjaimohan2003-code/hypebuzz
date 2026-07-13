begin;

-- Existing public read policies remain unchanged. These additional SELECT
-- policies allow only authenticated users with an active admin_users row to
-- inspect the complete catalog from the protected admin workspace.

create policy "Active admins can read all categories"
on public.categories for select
to authenticated
using (
  exists (
    select 1
    from public.admin_users
    where admin_users.user_id = (select auth.uid())
      and admin_users.role = 'admin'
      and admin_users.is_active = true
  )
);

create policy "Active admins can read all brands"
on public.brands for select
to authenticated
using (
  exists (
    select 1
    from public.admin_users
    where admin_users.user_id = (select auth.uid())
      and admin_users.role = 'admin'
      and admin_users.is_active = true
  )
);

create policy "Active admins can read all products"
on public.products for select
to authenticated
using (
  exists (
    select 1
    from public.admin_users
    where admin_users.user_id = (select auth.uid())
      and admin_users.role = 'admin'
      and admin_users.is_active = true
  )
);

create policy "Active admins can read all merchants"
on public.merchants for select
to authenticated
using (
  exists (
    select 1
    from public.admin_users
    where admin_users.user_id = (select auth.uid())
      and admin_users.role = 'admin'
      and admin_users.is_active = true
  )
);

create policy "Active admins can read all product offers"
on public.product_offers for select
to authenticated
using (
  exists (
    select 1
    from public.admin_users
    where admin_users.user_id = (select auth.uid())
      and admin_users.role = 'admin'
      and admin_users.is_active = true
  )
);

commit;
