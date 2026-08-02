-- Reconcile public asset reads so anonymous policy evaluation never requires
-- SELECT access to admin_users. Admin write policies remain unchanged.
begin;

create or replace function public.can_read_published_product_image_object(p_path text)
returns boolean language sql stable security definer set search_path='' as $$
  select exists (
    select 1 from public.product_images pi
    join public.products p on p.id=pi.product_id
    where pi.storage_path=p_path and pi.source_type='upload'
      and nullif(btrim(pi.image_url),'') is not null
      and p.status='published' and nullif(btrim(p.primary_image_url),'') is not null
  );
$$;
revoke all on function public.can_read_published_product_image_object(text) from public;
grant execute on function public.can_read_published_product_image_object(text) to anon, authenticated;

drop policy if exists "Published product image files are readable" on storage.objects;
drop policy if exists "Published product image objects are readable" on storage.objects;
create policy "Published product image objects are readable" on storage.objects
for select to anon, authenticated using (
  bucket_id='product-images'
  and public.can_read_published_product_image_object(name)
);

drop policy if exists "Public can read published knowledge hub items" on public.knowledge_hub_items;
create policy "Public can read published knowledge hub items" on public.knowledge_hub_items
for select to anon, authenticated using (status='published' and published_at is not null);

create or replace function public.can_read_published_knowledge_asset(p_bucket text,p_path text)
returns boolean language sql stable security definer set search_path='' as $$
  select exists (
    select 1 from public.knowledge_hub_items k
    where k.status='published' and k.published_at is not null and (
      (p_bucket='knowledge-hub-pdfs' and k.pdf_storage_path=p_path)
      or (p_bucket='knowledge-hub-thumbnails' and k.thumbnail_storage_path=p_path)
    )
  );
$$;
revoke all on function public.can_read_published_knowledge_asset(text,text) from public;
grant execute on function public.can_read_published_knowledge_asset(text,text) to anon, authenticated;

drop policy if exists "Published knowledge hub assets are readable" on storage.objects;
create policy "Published knowledge hub assets are readable" on storage.objects
for select to anon, authenticated using (
  bucket_id in ('knowledge-hub-pdfs','knowledge-hub-thumbnails')
  and public.can_read_published_knowledge_asset(bucket_id,name)
);

commit;
