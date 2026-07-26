begin;

-- Production reconciliation for product_offers only.
--
-- The product save functions are SECURITY INVOKER. Consequently, the signed-in
-- caller needs PostgreSQL table privileges in addition to passing RLS. The
-- repository originally supplied SELECT in migration 001, INSERT/UPDATE in 006,
-- and DELETE in 019. Reapplying this cumulative state is safe and idempotent.
-- DELETE is retained because replace_product_offers(uuid, jsonb) atomically
-- replaces the offer collection with DELETE followed by INSERT.

alter table public.product_offers enable row level security;

grant select, insert, update, delete on table public.product_offers to authenticated;

-- Anonymous storefront visitors retain SELECT through the existing public
-- eligibility policy, but can never mutate offers.
revoke insert, update, delete, truncate, references, trigger
  on table public.product_offers from anon;

-- Recreate only the admin policies. The public storefront SELECT policy is
-- deliberately left untouched.
drop policy if exists "Active admins can read all product offers"
  on public.product_offers;
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

drop policy if exists "Active admins can create product offers"
  on public.product_offers;
create policy "Active admins can create product offers"
on public.product_offers for insert
to authenticated
with check (
  exists (
    select 1
    from public.admin_users
    where admin_users.user_id = (select auth.uid())
      and admin_users.role = 'admin'
      and admin_users.is_active = true
  )
);

drop policy if exists "Active admins can update product offers"
  on public.product_offers;
create policy "Active admins can update product offers"
on public.product_offers for update
to authenticated
using (
  exists (
    select 1
    from public.admin_users
    where admin_users.user_id = (select auth.uid())
      and admin_users.role = 'admin'
      and admin_users.is_active = true
  )
)
with check (
  exists (
    select 1
    from public.admin_users
    where admin_users.user_id = (select auth.uid())
      and admin_users.role = 'admin'
      and admin_users.is_active = true
  )
);

drop policy if exists "Active admins can delete product offers"
  on public.product_offers;
create policy "Active admins can delete product offers"
on public.product_offers for delete
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

-- Read-only verification result 1: table privileges. Anonymous write rows must
-- be absent; authenticated SELECT/INSERT/UPDATE/DELETE rows must be present.
select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'product_offers'
  and grantee in ('anon', 'authenticated')
order by grantee, privilege_type;

-- Read-only verification result 2: RLS must remain enabled and not forced off.
select n.nspname as schema_name, c.relname as table_name,
  c.relrowsecurity as rls_enabled, c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'product_offers';

-- Read-only verification result 3: inspect both public-read and admin policies.
select policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'product_offers'
order by policyname;

-- Read-only verification result 4: confirm the current signed-in JWT resolves
-- to an active admin. In the SQL Editor auth.uid() is normally null; perform the
-- real write verification through the signed-in application or a transaction
-- that explicitly simulates the authenticated JWT claims.
select auth.uid() as authenticated_user_id,
  admin_users.user_id, admin_users.role, admin_users.is_active
from public.admin_users
where admin_users.user_id = (select auth.uid());

-- Read-only verification result 5: schema and foreign keys used by product save.
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'product_offers'
order by ordinal_position;

select con.conname as constraint_name,
  pg_get_constraintdef(con.oid) as definition
from pg_constraint con
join pg_class rel on rel.oid = con.conrelid
join pg_namespace n on n.oid = rel.relnamespace
where n.nspname = 'public'
  and rel.relname = 'product_offers'
  and con.contype = 'f'
order by con.conname;
