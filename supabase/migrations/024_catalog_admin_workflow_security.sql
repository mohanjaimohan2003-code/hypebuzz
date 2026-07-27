  begin;

  alter table public.admin_users enable row level security;
  alter table public.categories enable row level security;
  alter table public.brands enable row level security;
  alter table public.merchants enable row level security;
  alter table public.products enable row level security;
  alter table public.product_offers enable row level security;

  grant select on public.admin_users to authenticated;
  grant select, insert, update on public.categories, public.brands, public.merchants, public.products to authenticated;
  grant select, insert, update, delete on public.product_offers to authenticated;
  revoke insert, update, delete, truncate, references, trigger
    on public.admin_users, public.categories, public.brands, public.merchants, public.products, public.product_offers from anon;

  do $policy$
  declare
    target_table text;
    operation text;
    policy_name text;
  begin
    foreach target_table in array array['categories','brands','merchants','products','product_offers'] loop
      foreach operation in array array['select','insert','update'] loop
        policy_name := format('Active admins can %s %s', operation, replace(target_table, '_', ' '));
        execute format('drop policy if exists %I on public.%I', policy_name, target_table);
        if operation = 'select' then
          execute format('create policy %I on public.%I for select to authenticated using (exists (select 1 from public.admin_users au where au.user_id = (select auth.uid()) and au.role = ''admin'' and au.is_active = true))', policy_name, target_table);
        elsif operation = 'insert' then
          execute format('create policy %I on public.%I for insert to authenticated with check (exists (select 1 from public.admin_users au where au.user_id = (select auth.uid()) and au.role = ''admin'' and au.is_active = true))', policy_name, target_table);
        else
          execute format('create policy %I on public.%I for update to authenticated using (exists (select 1 from public.admin_users au where au.user_id = (select auth.uid()) and au.role = ''admin'' and au.is_active = true)) with check (exists (select 1 from public.admin_users au where au.user_id = (select auth.uid()) and au.role = ''admin'' and au.is_active = true))', policy_name, target_table);
        end if;
      end loop;
    end loop;
  end
  $policy$;

  drop policy if exists "Active admins can delete product offers" on public.product_offers;
  create policy "Active admins can delete product offers" on public.product_offers for delete to authenticated
  using (exists (select 1 from public.admin_users au where au.user_id = (select auth.uid()) and au.role = 'admin' and au.is_active = true));

  commit;
