begin;

grant select on table public.products, public.product_offers, public.categories, public.brands, public.merchants to anon, authenticated;
grant insert, update on table public.products, public.product_offers to authenticated;

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
        not exists (select 1 from public.categories category where category.id = product.category_id and category.is_active)
        or not exists (
          select 1
          from public.product_offers offer
          join public.merchants merchant on merchant.id = offer.merchant_id
          where offer.product_id = product.id
            and offer.is_active and merchant.is_active
            and offer.current_price > 0
            and offer.original_price is not null
            and offer.original_price >= offer.current_price
            and btrim(offer.affiliate_url) <> ''
            and offer.affiliate_url ~* '^https?://'
        )
      )
  ) then
    raise exception using errcode = '23514', message = 'Published products require an active category and eligible active offer';
  end if;
end;
$$;

create or replace function public.enforce_product_storefront_ready()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  perform public.assert_product_is_storefront_ready(coalesce(new.id, old.id));
  return coalesce(new, old);
end;
$$;

create or replace function public.enforce_offer_product_storefront_ready()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  perform public.assert_product_is_storefront_ready(coalesce(new.product_id, old.product_id));
  if old.product_id is distinct from new.product_id then
    perform public.assert_product_is_storefront_ready(old.product_id);
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists products_storefront_ready on public.products;
create constraint trigger products_storefront_ready
after insert or update on public.products
deferrable initially deferred
for each row execute function public.enforce_product_storefront_ready();

drop trigger if exists offers_keep_product_storefront_ready on public.product_offers;
create constraint trigger offers_keep_product_storefront_ready
after insert or update or delete on public.product_offers
deferrable initially deferred
for each row execute function public.enforce_offer_product_storefront_ready();

-- Product publication is an offer-backed catalog operation. This function is
-- security invoker: the caller still needs the existing authenticated grants
-- and active-admin RLS policies on both tables.
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
    raise exception using errcode = '23514', message = 'Invalid product status';
  end if;

  if not exists (select 1 from public.categories where id = p_category_id and (p_status <> 'published' or is_active)) then
    raise exception using errcode = '23503', message = 'Published products require an active category';
  end if;

  if p_status = 'published' and (
    p_merchant_id is null or p_affiliate_url is null or btrim(p_affiliate_url) = '' or
    p_current_price is null or p_current_price <= 0 or
    p_original_price is null or p_original_price <= 0 or p_original_price < p_current_price or
    p_offer_is_active is distinct from true or
    p_affiliate_url !~* '^https?://' or
    p_currency !~ '^[A-Z]{3}$' or
    p_availability not in ('in_stock', 'limited_stock', 'out_of_stock')
  ) then
    raise exception using errcode = '23514', message = 'Published products require a complete active offer';
  end if;

  if p_merchant_id is not null and not exists (
    select 1 from public.merchants where id = p_merchant_id and is_active = true
  ) then
    raise exception using errcode = '23503', message = 'Offers require an active merchant';
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
      name = p_name, slug = p_slug, short_description = nullif(p_short_description, ''),
      category_id = p_category_id, primary_image_url = nullif(p_primary_image_url, ''),
      is_featured = p_is_featured, is_trending = p_is_trending, status = 'draft'
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
        affiliate_url = excluded.affiliate_url, current_price = excluded.current_price,
        original_price = excluded.original_price, currency = excluded.currency,
        availability = excluded.availability, is_active = excluded.is_active
      returning id into saved_offer_id;
    else
      update public.product_offers set
        merchant_id = p_merchant_id, affiliate_url = p_affiliate_url,
        current_price = p_current_price, original_price = p_original_price,
        currency = p_currency, availability = p_availability,
        is_active = p_offer_is_active
      where id = p_offer_id and product_id = saved_product_id
      returning id into saved_offer_id;
      if saved_offer_id is null then raise no_data_found; end if;
    end if;
  end if;

  if p_status = 'published' then
    if not exists (
      select 1 from public.product_offers offer
      join public.merchants merchant on merchant.id = offer.merchant_id
      where offer.product_id = saved_product_id and offer.is_active
        and merchant.is_active and offer.current_price > 0
        and offer.original_price is not null and offer.original_price >= offer.current_price
        and btrim(offer.affiliate_url) <> '' and offer.affiliate_url ~* '^https?://'
    ) then
      raise exception using errcode = '23514', message = 'Published products require an eligible active offer';
    end if;
    update public.products set status = 'published' where id = saved_product_id;
  end if;

  return saved_product_id;
end;
$$;

revoke all on function public.save_product_with_offer(uuid, text, text, text, uuid, text, boolean, boolean, text, uuid, uuid, text, numeric, numeric, text, text, boolean) from public;
grant execute on function public.save_product_with_offer(uuid, text, text, text, uuid, text, boolean, boolean, text, uuid, uuid, text, numeric, numeric, text, text, boolean) to authenticated;

-- Rows created under the old contract are not safe to expose until an eligible
-- offer is attached. Preserve them for admins but remove them from public RLS.
update public.products product
set status = 'draft'
where product.status = 'published'
  and (
    not exists (select 1 from public.categories category where category.id = product.category_id and category.is_active)
    or not exists (
      select 1 from public.product_offers offer
      join public.merchants merchant on merchant.id = offer.merchant_id
      where offer.product_id = product.id and offer.is_active and merchant.is_active
        and offer.current_price > 0 and offer.original_price is not null
        and offer.original_price >= offer.current_price
        and btrim(offer.affiliate_url) <> '' and offer.affiliate_url ~* '^https?://'
    )
  );

commit;
