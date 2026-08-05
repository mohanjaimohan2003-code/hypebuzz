begin;

create or replace function public.upsert_master_product_offers(p_product_id uuid, p_offers jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare result jsonb;
begin
  if auth.uid() is null or not exists (
    select 1 from public.admin_users a where a.user_id=auth.uid() and a.role='admin' and a.is_active
  ) then raise exception using errcode='42501',message='ACTIVE_ADMIN_REQUIRED'; end if;
  if not exists(select 1 from public.products p where p.id=p_product_id) then raise exception using errcode='P0002',message='PRODUCT_NOT_FOUND'; end if;
  if jsonb_typeof(p_offers)<>'array' or jsonb_array_length(p_offers)<1 then raise exception using errcode='23514',message='AT_LEAST_ONE_OFFER_REQUIRED'; end if;
  if jsonb_array_length(p_offers)>5 then raise exception using errcode='23514',message='MAXIMUM_FIVE_OFFERS'; end if;
  if exists(select 1 from jsonb_array_elements(p_offers) o group by o->>'merchant_id' having count(*)>1) then raise exception using errcode='23514',message='DUPLICATE_MERCHANT'; end if;
  if exists(
    select 1 from jsonb_to_recordset(p_offers) o(merchant_id uuid,affiliate_url text,current_price numeric,currency text,availability text)
    left join public.merchants m on m.id=o.merchant_id and m.is_active
    where m.id is null or nullif(btrim(o.affiliate_url),'') is null or o.affiliate_url!~*'^https?://' or o.current_price<=0
      or o.currency!~'^[A-Z]{3}$' or o.availability not in ('in_stock','limited_stock','pre_order','out_of_stock','unknown')
  ) then raise exception using errcode='23514',message='OFFER_DATA_INVALID'; end if;

  with incoming as (
    select * from jsonb_to_recordset(p_offers) o(
      merchant_id uuid,affiliate_url text,current_price numeric,original_price numeric,currency text,
      availability text,coupon_note text,shipping_note text,offer_title text,is_active boolean,last_checked_at timestamptz
    )
  ), existing as materialized (
    select offer.merchant_id from public.product_offers offer join incoming i using(merchant_id) where offer.product_id=p_product_id
  ), saved as (
    insert into public.product_offers(product_id,merchant_id,affiliate_url,current_price,original_price,currency,availability,coupon_note,shipping_note,offer_title,is_active,last_checked_at)
    select p_product_id,merchant_id,affiliate_url,current_price,original_price,currency,availability,nullif(btrim(coupon_note),''),nullif(btrim(shipping_note),''),nullif(btrim(offer_title),''),coalesce(is_active,true),coalesce(last_checked_at,now()) from incoming
    on conflict(product_id,merchant_id) do update set affiliate_url=excluded.affiliate_url,current_price=excluded.current_price,original_price=excluded.original_price,currency=excluded.currency,availability=excluded.availability,coupon_note=excluded.coupon_note,shipping_note=excluded.shipping_note,offer_title=excluded.offer_title,is_active=excluded.is_active,last_checked_at=excluded.last_checked_at
    returning merchant_id
  )
  select jsonb_build_object('processed',count(*),'added',count(*) filter(where e.merchant_id is null),'updated',count(*) filter(where e.merchant_id is not null)) into result
  from saved s left join existing e using(merchant_id);
  return result;
end $$;

revoke all on function public.upsert_master_product_offers(uuid,jsonb) from public,anon;
grant execute on function public.upsert_master_product_offers(uuid,jsonb) to authenticated;
commit;
