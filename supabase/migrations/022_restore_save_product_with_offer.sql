-- Restore the 17-argument product/primary-offer RPC used by the admin Server Action.
-- Production verification on 2026-07-26 confirmed that this function is absent,
-- even though repository migrations 016 and 020 contain earlier definitions.
--
-- This migration is idempotent: CREATE OR REPLACE preserves the callable name and
-- signature. It changes no tables, columns, data, RLS policies, or public grants.
-- SECURITY INVOKER intentionally keeps the caller subject to existing table grants
-- and active-admin RLS policies. The explicit admin check provides an early,
-- understandable authorization failure before any write is attempted.

begin;

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
  offer_was_supplied boolean := p_merchant_id is not null;
begin
  if auth.uid() is null or not exists (
    select 1
    from public.admin_users admin_user
    where admin_user.user_id = auth.uid()
      and admin_user.role = 'admin'
      and admin_user.is_active = true
  ) then
    raise exception using errcode = '42501', message = 'ACTIVE_ADMIN_REQUIRED';
  end if;

  if nullif(btrim(p_name), '') is null then
    raise exception using errcode = '23514', message = 'PRODUCT_NAME_REQUIRED';
  end if;

  if nullif(btrim(p_slug), '') is null
     or p_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception using errcode = '23514', message = 'PRODUCT_SLUG_INVALID';
  end if;

  if p_status is null or p_status not in ('draft', 'published') then
    raise exception using errcode = '23514', message = 'PRODUCT_STATUS_INVALID';
  end if;

  -- The current application requires a category for drafts and publications.
  -- Publication additionally requires that category to be active.
  if p_category_id is null or not exists (
    select 1
    from public.categories category
    where category.id = p_category_id
      and (p_status <> 'published' or category.is_active = true)
  ) then
    raise exception using errcode = '23503', message = 'PRODUCT_CATEGORY_MISSING_OR_INACTIVE';
  end if;

  -- A draft may omit an offer. Reject partially supplied offer data instead of
  -- silently discarding it when merchant_id is null.
  if not offer_was_supplied and (
    p_offer_id is not null or p_affiliate_url is not null
    or p_current_price is not null or p_original_price is not null
    or p_currency is not null or p_availability is not null
    or p_offer_is_active is not null
  ) then
    raise exception using errcode = '23514', message = 'OFFER_MERCHANT_REQUIRED';
  end if;

  if offer_was_supplied and (
    p_affiliate_url is null or nullif(btrim(p_affiliate_url), '') is null
    or char_length(p_affiliate_url) > 2048
    or p_affiliate_url !~* '^https?://'
    or p_current_price is null or p_current_price <= 0
    or (p_original_price is not null and (
      p_original_price <= 0 or p_original_price < p_current_price
    ))
    or p_currency is null or p_currency !~ '^[A-Z]{3}$'
    or p_availability is null
    or p_availability not in (
      'in_stock', 'limited_stock', 'out_of_stock', 'pre_order', 'unknown'
    )
    or p_offer_is_active is null
  ) then
    raise exception using errcode = '23514', message = 'OFFER_DATA_INVALID';
  end if;

  if offer_was_supplied and not exists (
    select 1
    from public.merchants merchant
    where merchant.id = p_merchant_id
      and (p_offer_is_active is not true or merchant.is_active = true)
  ) then
    raise exception using errcode = '23503', message = 'OFFER_MERCHANT_MISSING_OR_INACTIVE';
  end if;

  if p_status = 'published' and (
    not offer_was_supplied
    or p_offer_is_active is distinct from true
    or p_availability not in ('in_stock', 'limited_stock', 'pre_order')
  ) then
    raise exception using errcode = '23514', message = 'PRODUCT_ELIGIBLE_OFFER_REQUIRED';
  end if;

  -- Save as draft first so product/offer publication checks see a complete pair.
  if p_product_id is null then
    insert into public.products (
      name, slug, short_description, category_id, primary_image_url,
      is_featured, is_trending, status
    ) values (
      btrim(p_name), p_slug, nullif(btrim(p_short_description), ''),
      p_category_id, nullif(btrim(p_primary_image_url), ''),
      coalesce(p_is_featured, false), coalesce(p_is_trending, false), 'draft'
    )
    returning id into saved_product_id;
  else
    update public.products
    set name = btrim(p_name),
        slug = p_slug,
        short_description = nullif(btrim(p_short_description), ''),
        category_id = p_category_id,
        primary_image_url = nullif(btrim(p_primary_image_url), ''),
        is_featured = coalesce(p_is_featured, false),
        is_trending = coalesce(p_is_trending, false),
        status = 'draft'
    where id = p_product_id
    returning id into saved_product_id;

    if saved_product_id is null then
      raise exception using errcode = 'P0002', message = 'PRODUCT_NOT_FOUND';
    end if;
  end if;

  if offer_was_supplied then
    if p_offer_id is null then
      insert into public.product_offers (
        product_id, merchant_id, affiliate_url, current_price, original_price,
        currency, availability, is_active
      ) values (
        saved_product_id, p_merchant_id, btrim(p_affiliate_url), p_current_price,
        p_original_price, p_currency, p_availability, p_offer_is_active
      )
      on conflict (product_id, merchant_id) do update
      set affiliate_url = excluded.affiliate_url,
          current_price = excluded.current_price,
          original_price = excluded.original_price,
          currency = excluded.currency,
          availability = excluded.availability,
          is_active = excluded.is_active
      returning id into saved_offer_id;
    else
      update public.product_offers
      set merchant_id = p_merchant_id,
          affiliate_url = btrim(p_affiliate_url),
          current_price = p_current_price,
          original_price = p_original_price,
          currency = p_currency,
          availability = p_availability,
          is_active = p_offer_is_active
      where id = p_offer_id
        and product_id = saved_product_id
      returning id into saved_offer_id;

      if saved_offer_id is null then
        raise exception using errcode = 'P0002', message = 'PRODUCT_OFFER_NOT_FOUND';
      end if;
    end if;
  end if;

  if p_status = 'published' then
    update public.products
    set status = 'published'
    where id = saved_product_id;
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

commit;
