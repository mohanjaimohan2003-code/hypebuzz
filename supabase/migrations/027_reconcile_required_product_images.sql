-- Forward-only reconciliation for required product images.
-- Safe to rerun: objects are guarded or replaced; existing products are retained.
begin;

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  image_url text not null,
  storage_path text,
  source_type text not null,
  alt_text text,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.product_images add column if not exists storage_path text;
alter table public.product_images add column if not exists source_type text default 'external';
alter table public.product_images add column if not exists alt_text text;
alter table public.product_images add column if not exists sort_order integer not null default 0;
alter table public.product_images add column if not exists is_primary boolean not null default false;
alter table public.product_images add column if not exists created_at timestamptz not null default now();

update public.product_images set source_type=case when storage_path is null then 'external' else 'upload' end where source_type is null;
alter table public.product_images alter column source_type set not null;

do $$ begin
  if not exists(select 1 from pg_constraint where conrelid='public.product_images'::regclass and contype='f' and pg_get_constraintdef(oid) like 'FOREIGN KEY (product_id) REFERENCES products(id)%ON DELETE CASCADE%') then
    alter table public.product_images add constraint product_images_product_id_fkey foreign key(product_id) references public.products(id) on delete cascade;
  end if;
  if not exists(select 1 from pg_constraint where conrelid='public.product_images'::regclass and conname='product_images_source_allowed') then
    alter table public.product_images add constraint product_images_source_allowed check(source_type in ('upload','external'));
  end if;
  if not exists(select 1 from pg_constraint where conrelid='public.product_images'::regclass and conname='product_images_source_storage_check') then
    alter table public.product_images add constraint product_images_source_storage_check check((source_type='upload' and storage_path is not null) or (source_type='external' and storage_path is null));
  end if;
  if not exists(select 1 from pg_constraint where conrelid='public.product_images'::regclass and conname='product_images_url_not_blank') then
    alter table public.product_images add constraint product_images_url_not_blank check(nullif(btrim(image_url),'') is not null);
  end if;
  if not exists(select 1 from pg_constraint where conrelid='public.product_images'::regclass and conname='product_images_sort_nonnegative') then
    alter table public.product_images add constraint product_images_sort_nonnegative check(sort_order>=0);
  end if;
end $$;

create index if not exists product_images_product_order_idx on public.product_images(product_id, sort_order);
create unique index if not exists product_images_one_primary_idx on public.product_images(product_id) where is_primary;

alter table public.product_images enable row level security;
revoke all on public.product_images from anon, authenticated;
grant select on public.product_images to anon, authenticated;
grant insert, update, delete on public.product_images to authenticated;

drop policy if exists "Public can read published product images" on public.product_images;
drop policy if exists "Public can read complete published product images" on public.product_images;
create policy "Public can read complete published product images" on public.product_images
for select to anon, authenticated using (
  nullif(btrim(image_url), '') is not null
  and exists (
    select 1 from public.products p
    where p.id = product_images.product_id
      and p.status = 'published'
      and nullif(btrim(p.primary_image_url), '') is not null
  )
);

drop policy if exists "Active admins manage product images" on public.product_images;
create policy "Active admins manage product images" on public.product_images
for all to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.role = 'admin' and a.is_active))
with check (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.role = 'admin' and a.is_active));

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('product-images','product-images',false,5242880,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set
  public=false,
  file_size_limit=excluded.file_size_limit,
  allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "Published product image files are readable" on storage.objects;
drop policy if exists "Published product image objects are readable" on storage.objects;
create policy "Published product image objects are readable" on storage.objects
for select to anon, authenticated using (
  bucket_id = 'product-images'
  and exists (
    select 1 from public.product_images pi
    join public.products p on p.id = pi.product_id
    where pi.storage_path = storage.objects.name
      and nullif(btrim(pi.image_url), '') is not null
      and p.status = 'published'
      and nullif(btrim(p.primary_image_url), '') is not null
  )
);

drop policy if exists "Active admins upload product image files" on storage.objects;
create policy "Active admins upload product image files" on storage.objects
for insert to authenticated with check (
  bucket_id = 'product-images'
  and exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.role = 'admin' and a.is_active)
);

drop policy if exists "Active admins update product image files" on storage.objects;
create policy "Active admins update product image files" on storage.objects
for update to authenticated
using (bucket_id = 'product-images' and exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.role = 'admin' and a.is_active))
with check (bucket_id = 'product-images' and exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.role = 'admin' and a.is_active));

drop policy if exists "Active admins delete product image files" on storage.objects;
create policy "Active admins delete product image files" on storage.objects
for delete to authenticated using (
  bucket_id = 'product-images'
  and exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.role = 'admin' and a.is_active)
);

create or replace function public.replace_product_images(p_product_id uuid, p_images jsonb)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.admin_users where user_id = (select auth.uid()) and role = 'admin' and is_active) then
    raise exception using errcode='42501', message='PRODUCT_IMAGE_POLICY_DENIED';
  end if;
  if not exists (select 1 from public.products where id=p_product_id) then
    raise exception using errcode='23503', message='PRODUCT_NOT_FOUND_FOR_IMAGES';
  end if;
  if jsonb_typeof(p_images) <> 'array' or jsonb_array_length(p_images) < 1 or jsonb_array_length(p_images) > 8 then
    raise exception using errcode='23514', message='PRODUCT_IMAGE_REQUIRED';
  end if;
  if (select count(*) from jsonb_array_elements(p_images) i where coalesce((i->>'is_primary')::boolean,false)) <> 1 then
    raise exception using errcode='23514', message='PRODUCT_PRIMARY_IMAGE_REQUIRED';
  end if;
  if exists (
    select 1 from jsonb_to_recordset(p_images) as i(id uuid,image_url text,storage_path text,source_type text,alt_text text,sort_order integer,is_primary boolean)
    where i.id is null or nullif(btrim(i.image_url),'') is null or i.source_type not in ('upload','external')
      or (i.source_type='upload' and nullif(btrim(i.storage_path),'') is null)
      or (i.source_type='external' and i.storage_path is not null)
      or i.sort_order < 0 or i.is_primary is null
  ) then raise exception using errcode='23514', message='PRODUCT_IMAGE_DATA_INVALID'; end if;

  delete from public.product_images where product_id=p_product_id;
  insert into public.product_images(id,product_id,image_url,storage_path,source_type,alt_text,sort_order,is_primary)
  select i.id,p_product_id,i.image_url,i.storage_path,i.source_type,i.alt_text,i.sort_order,i.is_primary
  from jsonb_to_recordset(p_images) as i(id uuid,image_url text,storage_path text,source_type text,alt_text text,sort_order integer,is_primary boolean);
  update public.products set primary_image_url=(select image_url from public.product_images where product_id=p_product_id and is_primary limit 1) where id=p_product_id;
end $$;
revoke all on function public.replace_product_images(uuid,jsonb) from public, anon;
grant execute on function public.replace_product_images(uuid,jsonb) to authenticated;

create or replace function public.delete_failed_product(p_product_id uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is null or not exists(select 1 from public.admin_users a where a.user_id=auth.uid() and a.role='admin' and a.is_active) then
    raise exception using errcode='42501',message='ACTIVE_ADMIN_REQUIRED';
  end if;
  delete from public.products where id=p_product_id;
end $$;
revoke all on function public.delete_failed_product(uuid) from public,anon;
grant execute on function public.delete_failed_product(uuid) to authenticated;

create or replace function public.create_product_with_images_and_offers(
  p_product jsonb,
  p_images jsonb,
  p_offers jsonb
) returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  saved_product_id uuid;
  requested_status text := p_product->>'status';
begin
  if auth.uid() is null or not exists (
    select 1 from public.admin_users a
    where a.user_id=auth.uid() and a.role='admin' and a.is_active
  ) then raise exception using errcode='42501', message='ACTIVE_ADMIN_REQUIRED'; end if;

  if jsonb_typeof(p_product)<>'object' then
    raise exception using errcode='23514', message='PRODUCT_DATA_INVALID';
  end if;
  if requested_status not in ('draft','published') then
    raise exception using errcode='23514', message='PRODUCT_STATUS_INVALID';
  end if;
  if jsonb_typeof(p_images)<>'array' or jsonb_array_length(p_images)<1 then
    raise exception using errcode='23514', message='PRODUCT_IMAGE_REQUIRED';
  end if;
  if jsonb_typeof(p_offers)<>'array' then
    raise exception using errcode='23514', message='PRODUCT_OFFERS_INVALID';
  end if;

  insert into public.products(
    name,slug,short_description,description,category_id,brand_id,primary_image_url,
    specifications,highlights,seo_title,seo_description,is_featured,is_trending,status
  ) values (
    btrim(p_product->>'name'),btrim(p_product->>'slug'),nullif(btrim(p_product->>'short_description'),''),
    nullif(btrim(p_product->>'description'),''),(p_product->>'category_id')::uuid,
    nullif(p_product->>'brand_id','')::uuid,nullif(btrim(p_product->>'primary_image_url'),''),
    coalesce(p_product->'specifications','{}'::jsonb),coalesce(p_product->'highlights','[]'::jsonb),
    nullif(btrim(p_product->>'seo_title'),''),nullif(btrim(p_product->>'seo_description'),''),
    coalesce((p_product->>'is_featured')::boolean,false),coalesce((p_product->>'is_trending')::boolean,false),'draft'
  ) returning id into saved_product_id;

  perform public.replace_product_images(saved_product_id,p_images);
  perform public.replace_product_offers(saved_product_id,p_offers);

  if requested_status='published' then
    update public.products set status='published' where id=saved_product_id;
  end if;
  return saved_product_id;
exception when others then
  -- PostgreSQL rolls back the product, image rows, and offers from this call.
  raise;
end $$;

revoke all on function public.create_product_with_images_and_offers(jsonb,jsonb,jsonb) from public, anon;
grant execute on function public.create_product_with_images_and_offers(jsonb,jsonb,jsonb) to authenticated;

create or replace function public.require_product_image_before_publish()
returns trigger language plpgsql set search_path='' as $$
begin
  if new.status='published' and (
    nullif(btrim(new.primary_image_url),'') is null
    or not exists (select 1 from public.product_images pi where pi.product_id=new.id and pi.is_primary and nullif(btrim(pi.image_url),'') is not null)
  ) then raise exception using errcode='23514', message='PRODUCT_IMAGE_REQUIRED_BEFORE_PUBLISH'; end if;
  return new;
end $$;

drop trigger if exists require_product_image_before_publish on public.products;
create constraint trigger require_product_image_before_publish
after insert or update of status, primary_image_url on public.products
deferrable initially deferred for each row execute function public.require_product_image_before_publish();

commit;
