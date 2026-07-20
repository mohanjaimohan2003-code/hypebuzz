begin;

alter table public.merchants
  add column affiliate_network text not null default 'Other',
  add column affiliate_tracking_parameter text,
  add constraint merchants_affiliate_network_not_blank
    check (btrim(affiliate_network) <> '');

-- Merchant writes use the signed-in user's publishable-key client. PostgreSQL
-- privileges allow the operations, while RLS restricts them to active admins.
grant insert, update on public.merchants to authenticated;

create policy "Active admins can create merchants"
on public.merchants for insert
to authenticated
with check (
  exists (
    select 1 from public.admin_users
    where admin_users.user_id = (select auth.uid())
      and admin_users.role = 'admin'
      and admin_users.is_active = true
  )
);

create policy "Active admins can update merchants"
on public.merchants for update
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

-- DELETE remains revoked and has no policy. Merchants are disabled by setting
-- is_active to false and can be re-enabled later.

commit;
