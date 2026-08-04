begin;

create or replace function public.get_affiliate_click_analytics(
  p_start_at timestamptz default null,
  p_end_at timestamptz default null
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  result jsonb;
begin
  if not exists (
    select 1 from public.admin_users
    where user_id = (select auth.uid()) and role = 'admin' and is_active = true
  ) then
    raise insufficient_privilege using message = 'Active admin access required';
  end if;

  with filtered as materialized (
    select * from public.affiliate_clicks
    where (p_start_at is null or clicked_at >= p_start_at)
      and (p_end_at is null or clicked_at < p_end_at)
  )
  select jsonb_build_object(
      'total_clicks', (select count(*) from filtered),
      'active_products', (select count(distinct product_id) from filtered where product_id is not null),
      'active_merchants', (select count(distinct merchant_id) from filtered where merchant_id is not null),
      'top_products', coalesce((
        select jsonb_agg(to_jsonb(totals) order by totals.click_count desc, totals.product_name)
        from (
          select click.product_id, coalesce(product.name, 'Deleted product') as product_name, count(*) as click_count
          from filtered click left join public.products product on product.id = click.product_id
          group by click.product_id, product.name order by count(*) desc, product_name limit 5
        ) totals
      ), '[]'::jsonb),
      'top_merchants', coalesce((
        select jsonb_agg(to_jsonb(totals) order by totals.click_count desc, totals.merchant_name)
        from (
          select click.merchant_id, coalesce(merchant.name, 'Deleted merchant') as merchant_name, count(*) as click_count
          from filtered click left join public.merchants merchant on merchant.id = click.merchant_id
          group by click.merchant_id, merchant.name order by count(*) desc, merchant_name limit 5
        ) totals
      ), '[]'::jsonb)
    ) into result;

  return result;
end;
$$;

revoke all on function public.get_affiliate_click_analytics(timestamptz, timestamptz) from public, anon;
grant execute on function public.get_affiliate_click_analytics(timestamptz, timestamptz) to authenticated;

commit;
