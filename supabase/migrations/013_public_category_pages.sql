begin;

-- Category browsing remains read-only and security invoker so every referenced
-- table continues to use the caller's existing public RLS policies.
create or replace function public.search_category_products(
  p_category_slug text,
  p_query text default null,
  p_brand_slug text default null,
  p_merchant_slug text default null,
  p_min_price numeric default null,
  p_max_price numeric default null,
  p_min_discount numeric default null,
  p_availability text default null,
  p_best_price_only boolean default false,
  p_featured boolean default false,
  p_trending boolean default false,
  p_sort text default 'relevance',
  p_limit integer default 48
)
returns table (
  id uuid,
  name text,
  slug text,
  primary_image_url text,
  brand_name text,
  best_price numeric,
  currency text,
  store_count bigint,
  biggest_discount numeric,
  total_count bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    product.id,
    product.name,
    product.slug,
    product.primary_image_url,
    brand.name as brand_name,
    offers.best_price,
    offers.currency,
    offers.store_count,
    offers.biggest_discount,
    count(*) over () as total_count
  from public.products as product
  join public.categories as category on category.id = product.category_id
  left join public.brands as brand on brand.id = product.brand_id
  cross join lateral (
    select
      cheapest.current_price as best_price,
      cheapest.currency,
      aggregate_values.store_count,
      aggregate_values.biggest_discount
    from (
      select offer.current_price, offer.currency
      from public.product_offers as offer
      where offer.product_id = product.id
      order by offer.current_price asc, offer.updated_at desc
      limit 1
    ) as cheapest
    cross join lateral (
      select
        count(distinct offer.merchant_id) as store_count,
        max(
          case
            when offer.original_price is not null and offer.original_price > 0
              then ((offer.original_price - offer.current_price) / offer.original_price) * 100
            else null
          end
        ) as biggest_discount
      from public.product_offers as offer
      where offer.product_id = product.id
    ) as aggregate_values
  ) as offers
  where product.status = 'published'
    and category.slug = p_category_slug
    and category.is_active = true
    and (
      nullif(btrim(p_query), '') is null
      or strpos(lower(product.name), lower(btrim(p_query))) > 0
      or strpos(lower(coalesce(brand.name, '')), lower(btrim(p_query))) > 0
      or exists (
        select 1
        from public.product_offers as matching_offer
        join public.merchants as merchant on merchant.id = matching_offer.merchant_id
        where matching_offer.product_id = product.id
          and strpos(lower(merchant.name), lower(btrim(p_query))) > 0
      )
    )
    and (p_brand_slug is null or brand.slug = p_brand_slug)
    and (
      p_merchant_slug is null
      or exists (
        select 1
        from public.product_offers as merchant_offer
        join public.merchants as merchant on merchant.id = merchant_offer.merchant_id
        where merchant_offer.product_id = product.id
          and merchant.slug = p_merchant_slug
      )
    )
    and (p_min_price is null or offers.best_price >= p_min_price)
    and (p_max_price is null or offers.best_price <= p_max_price)
    and (p_min_discount is null or coalesce(offers.biggest_discount, 0) >= p_min_discount)
    and (
      p_availability is null
      or exists (
        select 1
        from public.product_offers as available_offer
        where available_offer.product_id = product.id
          and available_offer.availability = p_availability
      )
    )
    and (not p_best_price_only or offers.store_count > 1)
    and (not p_featured or product.is_featured = true)
    and (not p_trending or product.is_trending = true)
  order by
    case when p_sort = 'relevance' and lower(product.name) = lower(btrim(coalesce(p_query, ''))) then 0 else 1 end,
    case when p_sort = 'relevance' and left(lower(product.name), length(btrim(coalesce(p_query, '')))) = lower(btrim(coalesce(p_query, ''))) then 0 else 1 end,
    case when p_sort = 'price_low' then offers.best_price end asc,
    case when p_sort = 'price_high' then offers.best_price end desc,
    case when p_sort = 'discount' then offers.biggest_discount end desc nulls last,
    case when p_sort = 'newest' then product.created_at end desc,
    product.name asc
  limit least(greatest(coalesce(p_limit, 48), 1), 100);
$$;

revoke all on function public.search_category_products(text, text, text, text, numeric, numeric, numeric, text, boolean, boolean, boolean, text, integer) from public;
grant execute on function public.search_category_products(text, text, text, text, numeric, numeric, numeric, text, boolean, boolean, boolean, text, integer) to anon, authenticated;

commit;
