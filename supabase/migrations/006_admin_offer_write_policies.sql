begin;

-- Migration 003 already grants active admins full SELECT access while the
-- existing public policy continues to expose only eligible active offers.
-- This migration adds write privileges without weakening either read policy.
grant insert, update on public.product_offers to authenticated;

create policy "Active admins can create product offers"
on public.product_offers for insert
to authenticated
with check (
  exists (
    select 1 from public.admin_users
    where admin_users.user_id = (select auth.uid())
      and admin_users.role = 'admin'
      and admin_users.is_active = true
  )
);

create policy "Active admins can update product offers"
on public.product_offers for update
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

-- DELETE remains revoked and has no policy. Offers are disabled by setting
-- is_active to false and can be re-enabled through the editor.

commit;
