-- Restore only the confirmed missing prerequisites required by migration 027.
-- Existing rows, tables, RLS, policies, grants, and unrelated objects are preserved.

begin;

do $$
declare
  missing_columns text;
begin
  if to_regclass('public.products') is null then
    raise exception using errcode = '42P01', message = 'Required table public.products is missing';
  end if;
  if to_regclass('public.product_offers') is null then
    raise exception using errcode = '42P01', message = 'Required table public.product_offers is missing';
  end if;

  select string_agg(required.column_name, ', ' order by required.column_name)
  into missing_columns
  from (values
    ('id'), ('product_id'), ('merchant_id'), ('affiliate_url'),
    ('current_price'), ('original_price'), ('currency'), ('availability'),
    ('is_active'), ('coupon_note'), ('last_checked_at')
  ) as required(column_name)
  where not exists (
    select 1
    from information_schema.columns actual
    where actual.table_schema = 'public'
      and actual.table_name = 'product_offers'
      and actual.column_name = required.column_name
  );

  if missing_columns is not null then
    raise exception using
      errcode = '42703',
      message = 'public.product_offers is missing foundational columns',
      detail = missing_columns,
      hint = 'Reconcile the foundational product_offers schema before applying this migration.';
  end if;
end;
$$;

alter table public.products
  add column if not exists highlights jsonb not null default '[]'::jsonb,
  add column if not exists seo_title text,
  add column if not exists seo_description text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'products_highlights_array'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
      add constraint products_highlights_array
      check (jsonb_typeof(highlights) = 'array');
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'products_seo_title_length'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
      add constraint products_seo_title_length
      check (seo_title is null or char_length(seo_title) <= 200);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'products_seo_description_length'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
      add constraint products_seo_description_length
      check (seo_description is null or char_length(seo_description) <= 500);
  end if;
end;
$$;

-- These are the only migration-019 columns directly required by the canonical
-- replace_product_offers(uuid,jsonb) function that were not in migration 001.
alter table public.product_offers
  add column if not exists offer_title text,
  add column if not exists shipping_note text;

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
    select merchant_id
    from jsonb_to_recordset(p_offers) as offer(merchant_id uuid, is_active boolean)
    group by merchant_id
    having count(*) > 1
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

revoke all on function public.replace_product_offers(uuid, jsonb) from public, anon;
grant execute on function public.replace_product_offers(uuid, jsonb) to authenticated;

commit;

-- Verification 1: the exact function signature must resolve.
select to_regprocedure('public.replace_product_offers(uuid,jsonb)')
  as replace_product_offers_signature;

-- Verification 2: migration-027 product columns and their deployed definitions.
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'products'
  and column_name in ('highlights', 'seo_title', 'seo_description')
order by column_name;

-- Verification 3: every product_offers column referenced by the function.
with required(column_name) as (values
  ('id'), ('product_id'), ('merchant_id'), ('affiliate_url'),
  ('current_price'), ('original_price'), ('currency'), ('availability'),
  ('is_active'), ('coupon_note'), ('shipping_note'), ('offer_title'),
  ('last_checked_at')
)
select required.column_name,
  actual.data_type,
  actual.is_nullable,
  actual.column_default,
  (actual.column_name is not null) as present
from required
left join information_schema.columns actual
  on actual.table_schema = 'public'
 and actual.table_name = 'product_offers'
 and actual.column_name = required.column_name
order by required.column_name;

-- Verification 4: foundational product_offers keys used during replacement.
select constraint_name, constraint_type
from information_schema.table_constraints
where table_schema = 'public'
  and table_name = 'product_offers'
  and constraint_type in ('PRIMARY KEY', 'FOREIGN KEY', 'UNIQUE')
order by constraint_type, constraint_name;
