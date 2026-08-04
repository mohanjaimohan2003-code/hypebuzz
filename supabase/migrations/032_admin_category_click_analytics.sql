begin;

create or replace function public.get_category_click_performance(
  p_start_at timestamptz default null,
  p_end_at timestamptz default null
)
returns table(category_id uuid, category_name text, click_count bigint)
language plpgsql
stable
security invoker
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.admin_users
    where user_id = (select auth.uid()) and role = 'admin' and is_active = true
  ) then
    raise insufficient_privilege using message = 'Active admin access required';
  end if;

  return query
  select
    category.id,
    coalesce(category.name, 'Unknown category') as category_name,
    count(*) as click_count
  from public.affiliate_clicks as click
  left join public.products as product on product.id = click.product_id
  left join public.categories as category on category.id = product.category_id
  where (p_start_at is null or click.clicked_at >= p_start_at)
    and (p_end_at is null or click.clicked_at < p_end_at)
  group by category.id, category.name
  order by count(*) desc, category_name asc;
end;
$$;

revoke all on function public.get_category_click_performance(timestamptz, timestamptz) from public, anon;
grant execute on function public.get_category_click_performance(timestamptz, timestamptz) to authenticated;

commit;
