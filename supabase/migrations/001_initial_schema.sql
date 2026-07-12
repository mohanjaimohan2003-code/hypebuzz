begin;

create extension if not exists pgcrypto;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_name_not_blank check (btrim(name) <> ''),
  constraint categories_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  logo_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint brands_name_not_blank check (btrim(name) <> ''),
  constraint brands_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  amazon_asin text,
  short_description text,
  description text,
  category_id uuid references public.categories(id) on delete set null,
  brand_id uuid references public.brands(id) on delete set null,
  primary_image_url text,
  specifications jsonb not null default '{}'::jsonb,
  status text not null default 'draft',
  is_featured boolean not null default false,
  is_trending boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_name_not_blank check (btrim(name) <> ''),
  constraint products_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint products_amazon_asin_format check (
    amazon_asin is null or amazon_asin ~ '^[A-Z0-9]{10}$'
  ),
  constraint products_specifications_object check (jsonb_typeof(specifications) = 'object'),
  constraint products_status_allowed check (status in ('draft', 'published', 'archived'))
);

create unique index products_amazon_asin_unique_idx
  on public.products (amazon_asin)
  where amazon_asin is not null;

create table public.merchants (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  logo_url text,
  website_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint merchants_name_not_blank check (btrim(name) <> ''),
  constraint merchants_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.product_offers (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  affiliate_url text not null,
  current_price numeric(12, 2) not null,
  original_price numeric(12, 2),
  currency text not null default 'INR',
  availability text,
  coupon_note text,
  is_active boolean not null default true,
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_offers_product_merchant_unique unique (product_id, merchant_id),
  constraint product_offers_affiliate_url_not_blank check (btrim(affiliate_url) <> ''),
  constraint product_offers_current_price_nonnegative check (current_price >= 0),
  constraint product_offers_original_price_nonnegative check (
    original_price is null or original_price >= 0
  ),
  constraint product_offers_currency_format check (currency ~ '^[A-Z]{3}$')
);

create index products_category_id_idx on public.products (category_id);
create index products_brand_id_idx on public.products (brand_id);
create index products_status_created_at_idx on public.products (status, created_at desc);
create index products_featured_published_idx
  on public.products (created_at desc)
  where status = 'published' and is_featured = true;
create index products_trending_published_idx
  on public.products (created_at desc)
  where status = 'published' and is_trending = true;
create index product_offers_product_active_idx
  on public.product_offers (product_id, current_price)
  where is_active = true;
create index product_offers_merchant_id_idx on public.product_offers (merchant_id);
create index product_offers_last_checked_at_idx
  on public.product_offers (last_checked_at desc nulls last);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger categories_set_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

create trigger brands_set_updated_at
before update on public.brands
for each row execute function public.set_updated_at();

create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

create trigger merchants_set_updated_at
before update on public.merchants
for each row execute function public.set_updated_at();

create trigger product_offers_set_updated_at
before update on public.product_offers
for each row execute function public.set_updated_at();

insert into public.merchants (name, slug, website_url)
values
  ('Amazon', 'amazon', 'https://www.amazon.in'),
  ('Flipkart', 'flipkart', 'https://www.flipkart.com'),
  ('Croma', 'croma', 'https://www.croma.com'),
  ('Reliance Digital', 'reliance-digital', 'https://www.reliancedigital.in'),
  ('Vijay Sales', 'vijay-sales', 'https://www.vijaysales.com')
on conflict (slug) do nothing;

alter table public.categories enable row level security;
alter table public.brands enable row level security;
alter table public.products enable row level security;
alter table public.merchants enable row level security;
alter table public.product_offers enable row level security;

revoke insert, update, delete, truncate, references, trigger
  on public.categories, public.brands, public.products, public.merchants, public.product_offers
  from anon, authenticated;

grant select
  on public.categories, public.brands, public.products, public.merchants, public.product_offers
  to anon, authenticated;

create policy "Public can read active categories"
on public.categories for select
to anon, authenticated
using (is_active = true);

create policy "Public can read active brands"
on public.brands for select
to anon, authenticated
using (is_active = true);

create policy "Public can read published products"
on public.products for select
to anon, authenticated
using (status = 'published');

create policy "Public can read active merchants"
on public.merchants for select
to anon, authenticated
using (is_active = true);

create policy "Public can read eligible product offers"
on public.product_offers for select
to anon, authenticated
using (
  is_active = true
  and exists (
    select 1
    from public.products
    where products.id = product_offers.product_id
      and products.status = 'published'
  )
  and exists (
    select 1
    from public.merchants
    where merchants.id = product_offers.merchant_id
      and merchants.is_active = true
  )
);

commit;
