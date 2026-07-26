begin;

alter table public.product_offers
  add column offer_title text,
  add column shipping_note text;

alter table public.product_offers
  add constraint product_offers_availability_allowed check (
    availability is null or availability in ('in_stock', 'limited_stock', 'out_of_stock', 'pre_order', 'unknown')
  ),
  add constraint product_offers_offer_title_length check (offer_title is null or char_length(offer_title) <= 160),
  add constraint product_offers_coupon_code_length check (coupon_note is null or char_length(coupon_note) <= 100),
  add constraint product_offers_shipping_note_length check (shipping_note is null or char_length(shipping_note) <= 300);

grant delete on public.product_offers to authenticated;

create policy "Active admins can delete product offers"
on public.product_offers for delete
to authenticated
using (
  exists (
    select 1 from public.admin_users
    where admin_users.user_id = (select auth.uid())
      and admin_users.role = 'admin'
      and admin_users.is_active = true
  )
);

create or replace function public.replace_product_offers(p_product_id uuid, p_offers jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if jsonb_typeof(p_offers) <> 'array' then
    raise exception using errcode = '23514', message = 'Invalid offer list';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_offers) as offer(
      id uuid, merchant_id uuid, affiliate_url text, current_price numeric,
      original_price numeric, currency text, availability text, is_active boolean,
      coupon_code text, shipping_note text, offer_title text, last_checked_at timestamptz
    )
    where offer.id is null
      or offer.merchant_id is null
      or offer.current_price is null or offer.current_price <= 0
      or offer.original_price is not null and offer.original_price < offer.current_price
      or offer.currency !~ '^[A-Z]{3}$'
      or offer.availability not in ('in_stock', 'limited_stock', 'out_of_stock', 'pre_order', 'unknown')
      or nullif(btrim(offer.affiliate_url), '') is null
      or offer.affiliate_url !~* '^https?://'
      or offer.is_active is null
  ) then
    raise exception using errcode = '23514', message = 'Invalid offer data';
  end if;

  if exists (
    select merchant_id from jsonb_to_recordset(p_offers) as offer(merchant_id uuid, is_active boolean)
    group by merchant_id having count(*) > 1
  ) then
    raise exception using errcode = '23505', message = 'Duplicate active merchant offer';
  end if;

  delete from public.product_offers where product_id = p_product_id;
  insert into public.product_offers (
    id, product_id, merchant_id, affiliate_url, current_price, original_price,
    currency, availability, is_active, coupon_note, shipping_note, offer_title,
    last_checked_at
  )
  select offer.id, p_product_id, offer.merchant_id, offer.affiliate_url,
    offer.current_price, offer.original_price, offer.currency, offer.availability,
    offer.is_active, nullif(btrim(offer.coupon_code), ''),
    nullif(btrim(offer.shipping_note), ''), nullif(btrim(offer.offer_title), ''),
    offer.last_checked_at
  from jsonb_to_recordset(p_offers) as offer(
    id uuid, merchant_id uuid, affiliate_url text, current_price numeric,
    original_price numeric, currency text, availability text, is_active boolean,
    coupon_code text, shipping_note text, offer_title text, last_checked_at timestamptz
  );
end;
$$;

revoke all on function public.replace_product_offers(uuid, jsonb) from public;
grant execute on function public.replace_product_offers(uuid, jsonb) to authenticated;

-- The existing publication rule remains: a published product needs an active,
-- valid offer. Pre-orders are eligible when their status is clearly labelled.
create or replace function public.assert_product_is_storefront_ready(p_product_id uuid)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  if exists (
    select 1 from public.products product
    where product.id = p_product_id and product.status = 'published' and (
      not exists (select 1 from public.categories category where category.id = product.category_id and category.is_active)
      or not exists (
        select 1 from public.product_offers offer
        join public.merchants merchant on merchant.id = offer.merchant_id
        where offer.product_id = product.id and offer.is_active and merchant.is_active
          and offer.current_price > 0
          and (offer.original_price is null or offer.original_price >= offer.current_price)
          and btrim(offer.affiliate_url) <> '' and offer.affiliate_url ~* '^https?://'
          and offer.availability in ('in_stock', 'limited_stock', 'pre_order')
      )
    )
  ) then
    raise exception using errcode = '23514', message = 'Published products require an active category and eligible active offer';
  end if;
end;
$$;

commit;
