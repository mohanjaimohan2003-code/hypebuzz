begin;

create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint admin_users_role_allowed check (role = 'admin')
);

alter table public.admin_users enable row level security;

revoke all on public.admin_users from anon, authenticated;
grant select on public.admin_users to authenticated;

create policy "Admins can read their own active role"
on public.admin_users for select
to authenticated
using ((select auth.uid()) = user_id and is_active = true and role = 'admin');

commit;
