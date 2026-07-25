begin;

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  image_url text not null,
  storage_path text,
  source_type text not null,
  alt_text text,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  constraint product_images_source_allowed check (source_type in ('upload', 'external')),
  constraint product_images_source_storage_check check (
    (source_type = 'upload' and storage_path is not null) or
    (source_type = 'external' and storage_path is null)
  ),
  constraint product_images_url_not_blank check (btrim(image_url) <> ''),
  constraint product_images_sort_nonnegative check (sort_order >= 0)
);

create index product_images_product_order_idx on public.product_images (product_id, sort_order);
create unique index product_images_one_primary_idx on public.product_images (product_id) where is_primary;

insert into public.product_images (product_id, image_url, source_type, sort_order, is_primary)
select id, primary_image_url, 'external', 0, true from public.products
where primary_image_url is not null and btrim(primary_image_url) <> '';

alter table public.product_images enable row level security;
revoke all on public.product_images from anon, authenticated;
grant select on public.product_images to anon, authenticated;
grant insert, update, delete on public.product_images to authenticated;

create policy "Public can read published product images" on public.product_images
for select to anon, authenticated using (
  exists (select 1 from public.products where products.id = product_images.product_id and products.status = 'published')
  or exists (select 1 from public.admin_users where user_id = (select auth.uid()) and role = 'admin' and is_active)
);
create policy "Active admins manage product images" on public.product_images
for all to authenticated
using (exists (select 1 from public.admin_users where user_id = (select auth.uid()) and role = 'admin' and is_active))
with check (exists (select 1 from public.admin_users where user_id = (select auth.uid()) and role = 'admin' and is_active));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "Published product image files are readable" on storage.objects
for select to anon, authenticated using (
  bucket_id = 'product-images' and (
    exists (select 1 from public.products where id::text = (storage.foldername(name))[2] and status = 'published')
    or exists (select 1 from public.admin_users where user_id = (select auth.uid()) and role = 'admin' and is_active)
  )
);
create policy "Active admins upload product image files" on storage.objects
for insert to authenticated with check (
  bucket_id = 'product-images' and exists (select 1 from public.admin_users where user_id = (select auth.uid()) and role = 'admin' and is_active)
);
create policy "Active admins delete product image files" on storage.objects
for delete to authenticated using (
  bucket_id = 'product-images' and exists (select 1 from public.admin_users where user_id = (select auth.uid()) and role = 'admin' and is_active)
);

create or replace function public.delete_failed_product(p_product_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.admin_users where user_id = (select auth.uid()) and role = 'admin' and is_active) then
    raise exception using errcode = '42501', message = 'Admin access required';
  end if;
  delete from public.products where id = p_product_id;
end; $$;
revoke all on function public.delete_failed_product(uuid) from public;
grant execute on function public.delete_failed_product(uuid) to authenticated;

create or replace function public.replace_product_images(p_product_id uuid, p_images jsonb)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.admin_users where user_id = (select auth.uid()) and role = 'admin' and is_active) then
    raise exception using errcode = '42501', message = 'Admin access required';
  end if;
  if jsonb_typeof(p_images) <> 'array' or jsonb_array_length(p_images) > 8 then
    raise exception using errcode = '23514', message = 'Invalid product image list';
  end if;
  delete from public.product_images where product_id = p_product_id;
  insert into public.product_images (id, product_id, image_url, storage_path, source_type, alt_text, sort_order, is_primary)
  select x.id, p_product_id, x.image_url, x.storage_path, x.source_type, x.alt_text, x.sort_order, x.is_primary
  from jsonb_to_recordset(p_images) as x(id uuid, image_url text, storage_path text, source_type text, alt_text text, sort_order integer, is_primary boolean);
  update public.products set primary_image_url = (
    select image_url from public.product_images where product_id = p_product_id order by is_primary desc, sort_order limit 1
  ) where id = p_product_id;
end; $$;
revoke all on function public.replace_product_images(uuid, jsonb) from public;
grant execute on function public.replace_product_images(uuid, jsonb) to authenticated;

commit;
