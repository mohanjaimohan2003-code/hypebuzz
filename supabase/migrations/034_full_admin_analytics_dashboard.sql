begin;

create or replace function public.get_admin_analytics_dashboard(
  p_start_at timestamptz default null,
  p_end_at timestamptz default null,
  p_previous_start_at timestamptz default null,
  p_previous_end_at timestamptz default null,
  p_bucket text default 'day'
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  result jsonb;
  safe_bucket text := case when p_bucket in ('hour', 'day', 'week') then p_bucket else 'day' end;
begin
  if not exists (
    select 1 from public.admin_users
    where user_id = (select auth.uid()) and role = 'admin' and is_active = true
  ) then
    raise insufficient_privilege using message = 'Active admin access required';
  end if;

  with current_clicks as materialized (
    select * from public.affiliate_clicks
    where (p_start_at is null or clicked_at >= p_start_at)
      and (p_end_at is null or clicked_at < p_end_at)
  ), previous_clicks as materialized (
    select * from public.affiliate_clicks
    where p_previous_start_at is not null and p_previous_end_at is not null
      and clicked_at >= p_previous_start_at and clicked_at < p_previous_end_at
  )
  select jsonb_build_object(
    'total_clicks', (select count(*) from current_clicks),
    'previous_total_clicks', (select count(*) from previous_clicks),
    'active_products', (select count(distinct product_id) from current_clicks where product_id is not null),
    'active_merchants', (select count(distinct merchant_id) from current_clicks where merchant_id is not null),
    'represented_days', coalesce((
      select greatest(1, ((coalesce(p_end_at, now()) at time zone 'Asia/Kolkata')::date - (min(clicked_at) at time zone 'Asia/Kolkata')::date) + 1)
      from current_clicks
    ), 1),
    'top_products', coalesce((
      select jsonb_agg(to_jsonb(totals) order by totals.click_count desc, totals.product_name)
      from (
        select click.product_id, coalesce(product.name, 'Unknown product') product_name,
          coalesce(category.name, 'Unknown category') category_name, count(*) click_count
        from current_clicks click
        left join public.products product on product.id = click.product_id
        left join public.categories category on category.id = product.category_id
        group by click.product_id, product.name, category.name
        order by count(*) desc, product_name limit 8
      ) totals
    ), '[]'::jsonb),
    'top_merchants', coalesce((
      select jsonb_agg(to_jsonb(totals) order by totals.click_count desc, totals.merchant_name)
      from (
        select click.merchant_id, coalesce(merchant.name, 'Unknown merchant') merchant_name, count(*) click_count
        from current_clicks click left join public.merchants merchant on merchant.id = click.merchant_id
        group by click.merchant_id, merchant.name order by count(*) desc, merchant_name limit 8
      ) totals
    ), '[]'::jsonb),
    'top_categories', coalesce((
      select jsonb_agg(to_jsonb(totals) order by totals.click_count desc, totals.category_name)
      from (
        select category.id category_id, coalesce(category.name, 'Unknown category') category_name, count(*) click_count
        from current_clicks click
        left join public.products product on product.id = click.product_id
        left join public.categories category on category.id = product.category_id
        group by category.id, category.name order by count(*) desc, category_name limit 8
      ) totals
    ), '[]'::jsonb),
    'devices', coalesce((
      select jsonb_agg(to_jsonb(totals) order by totals.click_count desc, totals.device_name)
      from (
        select case when device_type in ('mobile','desktop','tablet') then initcap(device_type) else 'Unknown' end device_name,
          count(*) click_count
        from current_clicks group by 1 order by count(*) desc, 1
      ) totals
    ), '[]'::jsonb),
    'sources', coalesce((
      select jsonb_agg(to_jsonb(totals) order by totals.click_count desc, totals.source_name)
      from (
        select case
          when source_page is not null or lower(coalesce(referrer,'')) like '%hypebuzzshop.in%' then 'Internal'
          when nullif(btrim(referrer),'') is null then 'Direct / unavailable'
          when lower(referrer) ~ '(google\.|googleusercontent\.)' then 'Google Organic'
          when lower(referrer) ~ '(instagram\.|facebook\.|fb\.|whatsapp\.|youtube\.|x\.com|twitter\.|linkedin\.)' then 'Social Media'
          else 'External referral'
        end source_name, count(*) click_count
        from current_clicks group by 1 order by count(*) desc, 1
      ) totals
    ), '[]'::jsonb),
    'trend', coalesce((
      select jsonb_agg(to_jsonb(points) order by points.bucket_at)
      from (
        select date_trunc(safe_bucket, clicked_at at time zone 'Asia/Kolkata') bucket_at,
          case when safe_bucket = 'hour'
            then to_char(date_trunc('hour', clicked_at at time zone 'Asia/Kolkata'), 'DD Mon HH24:00')
            else to_char(date_trunc(safe_bucket, clicked_at at time zone 'Asia/Kolkata'), 'DD Mon')
          end bucket_label,
          count(*) click_count
        from current_clicks group by 1, 2 order by 1
      ) points
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

revoke all on function public.get_admin_analytics_dashboard(timestamptz, timestamptz, timestamptz, timestamptz, text) from public, anon;
grant execute on function public.get_admin_analytics_dashboard(timestamptz, timestamptz, timestamptz, timestamptz, text) to authenticated;

commit;
