-- PROPOSED FORWARD MIGRATION — DO NOT APPLY UNTIL PHASE 1 PRODUCTION
-- VERIFICATION CONFIRMS THAT MIGRATIONS 016 AND 019 (including their exact
-- function signatures and product_offers columns) ARE PRESENT.
--
-- This migration changes no tables, rows, keys, RLS policies, or triggers.
-- It replaces only the two functions whose validation rules diverged.
-- Existing deferred readiness triggers continue to call the replaced
-- assert_product_is_storefront_ready(uuid) function.

begin;

create or replace function public.assert_product_is_storefront_ready(p_product_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.products product
    where product.id = p_product_id
      and product.status = 'published'
      and (
        not exists (
          select 1 from public.categories category
          where category.id = product.category_id and category.is_active
        )
        or not exists (
          select 1
          from public.product_offers offer
          join public.merchants merchant on merchant.id = offer.merchant_id
          where offer.product_id = product.id
            and offer.is_active
            and merchant.is_active
            and offer.current_price > 0
            and (offer.original_price is null or (
              offer.original_price > 0 and offer.original_price >= offer.current_price
            ))
            and offer.currency ~ '^[A-Z]{3}$'
            and char_length(offer.affiliate_url) <= 2048
            and btrim(offer.affiliate_url) <> ''
            and offer.affiliate_url ~* '^https?://'
            and offer.availability in ('in_stock', 'limited_stock', 'pre_order')
        )
      )
  ) then
    raise exception using
      errcode = '23514',
      message = 'PRODUCT_NOT_PUBLICATION_READY: active category and eligible offer required';
  end if;
end;
$$;

-- Keep the existing 17-argument API used by the application. Phase 2B may
-- redesign the transaction boundary, but this phase only aligns its rules.
create or replace function public.save_product_with_offer(
  p_product_id uuid,
  p_name text,
  p_slug text,
  p_short_description text,
  p_category_id uuid,
  p_primary_image_url text,
  p_is_featured boolean,
  p_is_trending boolean,
  p_status text,
  p_offer_id uuid,
  p_merchant_id uuid,
  p_affiliate_url text,
  p_current_price numeric,
  p_original_price numeric,
  p_currency text,
  p_availability text,
  p_offer_is_active boolean
) returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  saved_product_id uuid;
  saved_offer_id uuid;
begin
  if p_status not in ('draft', 'published') then
    raise exception using errcode = '23514', message = 'PRODUCT_STATUS_INVALID';
  end if;

  if not exists (
    select 1 from public.categories
    where id = p_category_id and (p_status <> 'published' or is_active)
  ) then
    raise exception using errcode = '23503', message = 'PRODUCT_CATEGORY_INACTIVE';
  end if;

  -- An omitted offer is valid for a draft. Any supplied offer must satisfy
  -- the common stored-offer shape, regardless of product status.
  if p_merchant_id is not null and (
    p_affiliate_url is null or char_length(p_affiliate_url) > 2048
    or nullif(btrim(p_affiliate_url), '') is null
    or p_affiliate_url !~* '^https?://'
    or p_current_price is null or p_current_price <= 0
    or (p_original_price is not null and (
      p_original_price <= 0 or p_original_price < p_current_price
    ))
    or p_currency is null or p_currency !~ '^[A-Z]{3}$'
    or p_availability is null
    or p_availability not in ('in_stock', 'limited_stock', 'out_of_stock', 'pre_order', 'unknown')
    or p_offer_is_active is null
  ) then
    raise exception using errcode = '23514', message = 'OFFER_DATA_INVALID';
  end if;

  if p_merchant_id is not null and not exists (
    select 1 from public.merchants merchant
    where merchant.id = p_merchant_id
      and (p_offer_is_active is not true or merchant.is_active)
  ) then
    raise exception using errcode = '23503', message = 'OFFER_MERCHANT_INACTIVE';
  end if;

  if p_status = 'published' and (
    p_merchant_id is null
    or p_offer_is_active is distinct from true
    or p_availability not in ('in_stock', 'limited_stock', 'pre_order')
  ) then
    raise exception using errcode = '23514', message = 'PRODUCT_OFFER_REQUIRED';
  end if;

  if p_product_id is null then
    insert into public.products (
      name, slug, short_description, category_id, primary_image_url,
      is_featured, is_trending, status
    ) values (
      p_name, p_slug, nullif(p_short_description, ''), p_category_id,
      nullif(p_primary_image_url, ''), p_is_featured, p_is_trending, 'draft'
    ) returning id into saved_product_id;
  else
    update public.products set
      name = p_name,
      slug = p_slug,
      short_description = nullif(p_short_description, ''),
      category_id = p_category_id,
      primary_image_url = nullif(p_primary_image_url, ''),
      is_featured = p_is_featured,
      is_trending = p_is_trending,
      status = 'draft'
    where id = p_product_id
    returning id into saved_product_id;
    if saved_product_id is null then raise no_data_found; end if;
  end if;

  if p_merchant_id is not null then
    if p_offer_id is null then
      insert into public.product_offers (
        product_id, merchant_id, affiliate_url, current_price, original_price,
        currency, availability, is_active
      ) values (
        saved_product_id, p_merchant_id, p_affiliate_url, p_current_price,
        p_original_price, p_currency, p_availability, p_offer_is_active
      )
      on conflict (product_id, merchant_id) do update set
        affiliate_url = excluded.affiliate_url,
        current_price = excluded.current_price,
        original_price = excluded.original_price,
        currency = excluded.currency,
        availability = excluded.availability,
        is_active = excluded.is_active
      returning id into saved_offer_id;
    else
      update public.product_offers set
        merchant_id = p_merchant_id,
        affiliate_url = p_affiliate_url,
        current_price = p_current_price,
        original_price = p_original_price,
        currency = p_currency,
        availability = p_availability,
        is_active = p_offer_is_active
      where id = p_offer_id and product_id = saved_product_id
      returning id into saved_offer_id;
      if saved_offer_id is null then raise no_data_found; end if;
    end if;
  end if;

  if p_status = 'published' then
    update public.products set status = 'published' where id = saved_product_id;
    perform public.assert_product_is_storefront_ready(saved_product_id);
  end if;

  return saved_product_id;
end;
$$;

revoke all on function public.save_product_with_offer(
  uuid, text, text, text, uuid, text, boolean, boolean, text,
  uuid, uuid, text, numeric, numeric, text, text, boolean
) from public, anon;
grant execute on function public.save_product_with_offer(
  uuid, text, text, text, uuid, text, boolean, boolean, text,
  uuid, uuid, text, numeric, numeric, text, text, boolean
) to authenticated;

-- replace_product_offers is intentionally not redefined here. Its existing
-- replacement transaction is Phase 2B scope. The current 019 implementation
-- already validates the shared stored-offer shape; the deferred readiness
-- trigger calls the authoritative assertion above before a published product
-- can commit. Server Actions additionally re-read active merchant state.

commit;
