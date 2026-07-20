begin;

create table public.affiliate_clicks (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid references public.product_offers(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  merchant_id uuid references public.merchants(id) on delete set null,
  clicked_at timestamptz not null default now(),
  referrer text,
  user_agent text,
  device_type text,
  source_page text,
  session_id text,
  ip_hash text,
  created_at timestamptz not null default now(),
  constraint affiliate_clicks_device_type_allowed check (
    device_type is null or device_type in ('mobile', 'tablet', 'desktop', 'unknown')
  )
);

create index affiliate_clicks_offer_id_idx on public.affiliate_clicks (offer_id);
create index affiliate_clicks_product_id_idx on public.affiliate_clicks (product_id);
create index affiliate_clicks_merchant_id_idx on public.affiliate_clicks (merchant_id);
create index affiliate_clicks_clicked_at_idx on public.affiliate_clicks (clicked_at desc);

alter table public.affiliate_clicks enable row level security;

revoke all on public.affiliate_clicks from anon, authenticated;
grant select on public.affiliate_clicks to authenticated;

create policy "Active admins can read affiliate clicks"
on public.affiliate_clicks for select
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

create or replace function public.get_affiliate_click_summary()
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.admin_users
    where admin_users.user_id = (select auth.uid())
      and admin_users.role = 'admin'
      and admin_users.is_active = true
  ) then
    raise insufficient_privilege using message = 'Active admin access required';
  end if;

  return jsonb_build_object(
    'total_clicks', (select count(*) from public.affiliate_clicks),
    'clicks_today', (
      select count(*) from public.affiliate_clicks
      where clicked_at >= date_trunc('day', now())
    ),
    'clicks_last_7_days', (
      select count(*) from public.affiliate_clicks
      where clicked_at >= now() - interval '7 days'
    ),
    'top_products', coalesce((
      select jsonb_agg(to_jsonb(product_totals) order by product_totals.click_count desc, product_totals.product_name)
      from (
        select
          click.product_id,
          coalesce(product.name, 'Deleted product') as product_name,
          count(*) as click_count
        from public.affiliate_clicks as click
        left join public.products as product on product.id = click.product_id
        group by click.product_id, product.name
        order by count(*) desc, product.name
        limit 5
      ) as product_totals
    ), '[]'::jsonb),
    'top_merchants', coalesce((
      select jsonb_agg(to_jsonb(merchant_totals) order by merchant_totals.click_count desc, merchant_totals.merchant_name)
      from (
        select
          click.merchant_id,
          coalesce(merchant.name, 'Deleted merchant') as merchant_name,
          count(*) as click_count
        from public.affiliate_clicks as click
        left join public.merchants as merchant on merchant.id = click.merchant_id
        group by click.merchant_id, merchant.name
        order by count(*) desc, merchant.name
        limit 5
      ) as merchant_totals
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.get_affiliate_click_summary() from public, anon;
grant execute on function public.get_affiliate_click_summary() to authenticated;

commit;
