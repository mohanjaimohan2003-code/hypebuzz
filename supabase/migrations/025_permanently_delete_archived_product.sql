begin;

-- product_offers.product_id and product_images.product_id are ON DELETE CASCADE.
-- affiliate_clicks.product_id/offer_id are ON DELETE SET NULL. A single product
-- DELETE therefore removes owned catalog rows atomically without touching shared
-- brands, categories, or merchants, while retaining anonymized click history.
create or replace function public.permanently_delete_archived_product(p_product_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  archived_slug text;
begin
  if auth.uid() is null or not exists (
    select 1 from public.admin_users au
    where au.user_id = auth.uid() and au.role = 'admin' and au.is_active = true
  ) then
    raise exception using errcode = '42501', message = 'ACTIVE_ADMIN_REQUIRED';
  end if;

  select product.slug into archived_slug
  from public.products product
  where product.id = p_product_id
  for update;

  if archived_slug is null then
    raise exception using errcode = 'P0002', message = 'PRODUCT_NOT_FOUND';
  end if;

  if not exists (
    select 1 from public.products product
    where product.id = p_product_id and product.status = 'archived'
  ) then
    raise exception using errcode = '55000', message = 'PRODUCT_MUST_BE_ARCHIVED';
  end if;

  delete from public.products where id = p_product_id;
  return archived_slug;
end;
$$;

revoke all on function public.permanently_delete_archived_product(uuid) from public, anon;
grant execute on function public.permanently_delete_archived_product(uuid) to authenticated;

commit;
