-- Make create/edit product persistence one database transaction. Storage files
-- are uploaded before this RPC and compensated by the application if it fails.
begin;

create or replace function public.save_product_workflow(
  p_product_id uuid,
  p_product jsonb,
  p_images jsonb,
  p_offers jsonb
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  saved_product_id uuid;
  requested_status text := p_product->>'status';
  resolved_brand_id uuid := nullif(p_product->>'brand_id','')::uuid;
  imported_brand_name text := nullif(btrim(p_product->>'imported_brand_name'),'');
  imported_brand_slug text := nullif(btrim(p_product->>'imported_brand_slug'),'');
begin
  if auth.uid() is null or not exists (
    select 1 from public.admin_users a
    where a.user_id=auth.uid() and a.role='admin' and a.is_active
  ) then raise exception using errcode='42501', message='ACTIVE_ADMIN_REQUIRED'; end if;

  if jsonb_typeof(p_product)<>'object' or requested_status not in ('draft','published') then
    raise exception using errcode='23514', message='PRODUCT_DATA_INVALID';
  end if;
  if jsonb_typeof(p_images)<>'array' or jsonb_array_length(p_images)<1 or jsonb_array_length(p_images)>8 then
    raise exception using errcode='23514', message='PRODUCT_IMAGE_REQUIRED';
  end if;
  if jsonb_typeof(p_offers)<>'array' then
    raise exception using errcode='23514', message='PRODUCT_OFFERS_INVALID';
  end if;

  if resolved_brand_id is null and imported_brand_name is not null then
    select b.id into resolved_brand_id from public.brands b
    where lower(btrim(b.name))=lower(imported_brand_name) or b.slug=imported_brand_slug
    order by case when lower(btrim(b.name))=lower(imported_brand_name) then 0 else 1 end
    limit 1;
    if resolved_brand_id is null then
      if imported_brand_slug is null then raise exception using errcode='23514', message='IMPORTED_BRAND_INVALID'; end if;
      begin
        insert into public.brands(name,slug) values(imported_brand_name,imported_brand_slug) returning id into resolved_brand_id;
      exception when unique_violation then
        select b.id into resolved_brand_id from public.brands b
        where lower(btrim(b.name))=lower(imported_brand_name) or b.slug=imported_brand_slug limit 1;
        if resolved_brand_id is null then raise; end if;
      end;
    end if;
  end if;

  if p_product_id is null then
    insert into public.products(
      name,slug,short_description,description,category_id,brand_id,primary_image_url,
      specifications,highlights,seo_title,seo_description,is_featured,is_trending,status
    ) values (
      btrim(p_product->>'name'),btrim(p_product->>'slug'),nullif(btrim(p_product->>'short_description'),''),
      nullif(btrim(p_product->>'description'),''),(p_product->>'category_id')::uuid,resolved_brand_id,
      nullif(btrim(p_product->>'primary_image_url'),''),coalesce(p_product->'specifications','{}'::jsonb),
      coalesce(p_product->'highlights','[]'::jsonb),nullif(btrim(p_product->>'seo_title'),''),
      nullif(btrim(p_product->>'seo_description'),''),coalesce((p_product->>'is_featured')::boolean,false),
      coalesce((p_product->>'is_trending')::boolean,false),'draft'
    ) returning id into saved_product_id;
  else
    select p.id into saved_product_id from public.products p where p.id=p_product_id for update;
    if saved_product_id is null then raise exception using errcode='P0002', message='PRODUCT_NOT_FOUND'; end if;
    update public.products set
      name=btrim(p_product->>'name'), slug=btrim(p_product->>'slug'),
      short_description=nullif(btrim(p_product->>'short_description'),''),
      description=nullif(btrim(p_product->>'description'),''), category_id=(p_product->>'category_id')::uuid,
      brand_id=resolved_brand_id, primary_image_url=nullif(btrim(p_product->>'primary_image_url'),''),
      specifications=coalesce(p_product->'specifications','{}'::jsonb), highlights=coalesce(p_product->'highlights','[]'::jsonb),
      seo_title=nullif(btrim(p_product->>'seo_title'),''), seo_description=nullif(btrim(p_product->>'seo_description'),''),
      is_featured=coalesce((p_product->>'is_featured')::boolean,false),
      is_trending=coalesce((p_product->>'is_trending')::boolean,false), status='draft'
    where id=saved_product_id;
  end if;

  perform public.replace_product_images(saved_product_id,p_images);
  perform public.replace_product_offers(saved_product_id,p_offers);
  if requested_status='published' then update public.products set status='published' where id=saved_product_id; end if;
  return saved_product_id;
end $$;

revoke all on function public.save_product_workflow(uuid,jsonb,jsonb,jsonb) from public, anon;
grant execute on function public.save_product_workflow(uuid,jsonb,jsonb,jsonb) to authenticated;

commit;
