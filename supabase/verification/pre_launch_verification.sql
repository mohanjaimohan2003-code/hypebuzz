-- HypeBuzz pre-launch verification through repository migration 030.
-- READ ONLY: this file contains catalog/data SELECT statements only.
-- Run as a database owner in the intended Supabase project and export every result set.

select '00_context' as result_set, current_database() as database_name,
  current_user as executing_role, current_timestamp as checked_at;

with expected(name) as (values
  ('admin_users'),('categories'),('brands'),('merchants'),('products'),
  ('product_images'),('product_offers'),('product_reviews'),('affiliate_clicks'),('blog_categories'),
  ('blog_posts'),('blog_tags'),('blog_post_tags'),('knowledge_hub_items')
)
select '01_tables' as result_set, e.name,
  case when c.oid is null then 'MISSING' else 'OK' end as status
from expected e left join pg_namespace n on n.nspname='public'
left join pg_class c on c.relnamespace=n.oid and c.relname=e.name and c.relkind in ('r','p')
order by e.name;

with expected(table_name,column_name) as (values
  ('admin_users','user_id'),('admin_users','role'),('admin_users','is_active'),
  ('categories','id'),('categories','slug'),('categories','is_active'),('categories','display_order'),
  ('brands','id'),('brands','slug'),('brands','is_active'),
  ('merchants','id'),('merchants','slug'),('merchants','is_active'),
  ('products','id'),('products','name'),('products','slug'),('products','category_id'),
  ('products','brand_id'),('products','primary_image_url'),('products','specifications'),
  ('products','highlights'),('products','seo_title'),('products','seo_description'),('products','status'),
  ('product_images','id'),('product_images','product_id'),('product_images','image_url'),
  ('product_images','storage_path'),('product_images','source_type'),('product_images','is_primary'),
  ('product_offers','id'),('product_offers','product_id'),('product_offers','merchant_id'),
  ('product_offers','affiliate_url'),('product_offers','current_price'),('product_offers','availability'),
  ('product_offers','is_active'),('affiliate_clicks','offer_id'),('affiliate_clicks','clicked_at'),
  ('knowledge_hub_items','status'),('knowledge_hub_items','published_at'),
  ('knowledge_hub_items','pdf_storage_path'),('knowledge_hub_items','thumbnail_storage_path'),
  ('product_reviews','product_id'),('product_reviews','user_id'),('product_reviews','reviewer_name'),
  ('product_reviews','rating'),('product_reviews','review_text'),('product_reviews','status'),
  ('product_reviews','is_verified_buyer'),('product_reviews','created_at')
)
select '02_columns' as result_set, e.table_name,e.column_name,c.data_type,c.is_nullable,c.column_default,
  case when c.column_name is null then 'MISSING' else 'OK' end as status
from expected e left join information_schema.columns c
  on c.table_schema='public' and c.table_name=e.table_name and c.column_name=e.column_name
order by e.table_name,e.column_name;

with expected(name) as (values
 ('products_pkey'),('products_slug_key'),('products_amazon_asin_unique_idx'),
 ('products_category_id_idx'),('products_brand_id_idx'),('products_status_created_at_idx'),
 ('product_images_pkey'),('product_images_product_order_idx'),('product_images_one_primary_idx'),
 ('product_offers_pkey'),('product_offers_product_id_merchant_id_key'),
 ('product_offers_product_active_idx'),('product_offers_merchant_id_idx'),
 ('affiliate_clicks_clicked_at_idx'),('affiliate_clicks_offer_id_idx'),
 ('product_reviews_product_id_idx'),('product_reviews_status_idx'),('product_reviews_created_at_idx'),
 ('product_reviews_rating_idx'),('product_reviews_public_page_idx')
)
select '03_indexes' as result_set,e.name,i.tablename,i.indexdef,
 case when i.indexname is null then 'MISSING' else 'OK' end as status
from expected e left join pg_indexes i on i.schemaname='public' and i.indexname=e.name
order by e.name;

select '04_constraints_and_foreign_keys' as result_set,n.nspname as schema_name,
 c.relname as table_name,k.conname,k.contype,pg_get_constraintdef(k.oid) as definition
from pg_constraint k join pg_class c on c.oid=k.conrelid join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname in
 ('admin_users','categories','brands','merchants','products','product_images','product_offers','affiliate_clicks','knowledge_hub_items')
order by c.relname,k.contype,k.conname;

with expected(name,args,must_be_security_definer) as (values
 ('save_product_workflow','uuid, jsonb, jsonb, jsonb',true),
 ('replace_product_images','uuid, jsonb',true),
 ('replace_product_offers','uuid, jsonb',true),
 ('create_product_with_images_and_offers','jsonb, jsonb, jsonb',true),
 ('assert_product_is_storefront_ready','uuid',false),
 ('enforce_product_storefront_ready','',false),
 ('enforce_offer_product_storefront_ready','',false),
 ('require_product_image_before_publish','',false),
 ('can_read_published_product_image_object','text',true),
 ('can_read_published_knowledge_asset','text, text',true),
 ('get_product_review_summary','uuid',false)
), actual as (
 select p.proname,oidvectortypes(p.proargtypes) as args,p.prosecdef,
   pg_get_function_result(p.oid) as result_type,p.proacl
 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public'
)
select '05_functions' as result_set,e.name,e.args,a.result_type,a.prosecdef,a.proacl,
 case when a.proname is null then 'MISSING'
      when a.args<>e.args then 'SIGNATURE_MISMATCH'
      when a.prosecdef<>e.must_be_security_definer then 'SECURITY_MODE_MISMATCH'
      else 'OK' end as status
from expected e left join actual a on a.proname=e.name and a.args=e.args order by e.name;

with expected(table_name,trigger_name) as (values
 ('products','products_storefront_ready'),
 ('products','require_product_image_before_publish'),
 ('product_offers','offers_keep_product_storefront_ready'),
 ('product_reviews','product_reviews_set_updated_at')
)
select '06_publication_triggers' as result_set,e.table_name,e.trigger_name,
 pg_get_triggerdef(t.oid) as definition,
 case when t.oid is null then 'MISSING' when not t.tgenabled::text in ('O','A') then 'DISABLED' else 'OK' end as status
from expected e left join pg_class c on c.relname=e.table_name
left join pg_namespace n on n.oid=c.relnamespace and n.nspname='public'
left join pg_trigger t on t.tgrelid=c.oid and t.tgname=e.trigger_name and not t.tgisinternal
order by e.table_name,e.trigger_name;

with expected(schema_name,table_name) as (values
 ('public','admin_users'),('public','categories'),('public','brands'),('public','merchants'),
 ('public','products'),('public','product_images'),('public','product_offers'),
 ('public','affiliate_clicks'),('public','knowledge_hub_items'),('public','product_reviews'),('storage','objects')
)
select '07_rls' as result_set,e.schema_name,e.table_name,c.relrowsecurity,c.relforcerowsecurity,
 case when c.oid is null then 'MISSING' when c.relrowsecurity then 'OK' else 'RLS_DISABLED' end as status
from expected e left join pg_namespace n on n.nspname=e.schema_name
left join pg_class c on c.relnamespace=n.oid and c.relname=e.table_name
order by e.schema_name,e.table_name;

select '08_policies' as result_set,schemaname,tablename,policyname,roles,cmd,qual,with_check
from pg_policies where (schemaname='public' and tablename in
 ('admin_users','categories','brands','merchants','products','product_images','product_offers','product_reviews','affiliate_clicks','knowledge_hub_items'))
 or (schemaname='storage' and tablename='objects')
order by schemaname,tablename,policyname;

select '09_table_grants' as result_set,table_schema,table_name,grantee,privilege_type
from information_schema.role_table_grants
where table_schema in ('public','storage') and grantee in ('anon','authenticated')
order by table_schema,table_name,grantee,privilege_type;

select '10_routine_grants' as result_set,routine_schema,routine_name,grantee,privilege_type
from information_schema.role_routine_grants
where routine_schema='public' and grantee in ('PUBLIC','anon','authenticated')
order by routine_name,grantee;

with expected(id,is_public,file_size_limit) as (values
 ('product-images',false,5242880::bigint),
 ('knowledge-hub-pdfs',false,26214400::bigint),
 ('knowledge-hub-thumbnails',false,5242880::bigint)
)
select '11_storage_buckets' as result_set,e.id,e.is_public as expected_public,b.public as actual_public,
 e.file_size_limit as expected_limit,b.file_size_limit as actual_limit,b.allowed_mime_types,
 case when b.id is null then 'MISSING' when b.public<>e.is_public or b.file_size_limit<>e.file_size_limit then 'MISMATCH' else 'OK' end as status
from expected e left join storage.buckets b on b.id=e.id order by e.id;

select '12_migration_ledger_informational' as result_set,to_jsonb(m) as migration_record
from supabase_migrations.schema_migrations m order by m.version;

select '13_orphan_counts' as result_set,
 (select count(*) from public.product_images pi left join public.products p on p.id=pi.product_id where p.id is null) as product_images_without_product,
 (select count(*) from public.product_offers po left join public.products p on p.id=po.product_id where p.id is null) as offers_without_product,
 (select count(*) from public.product_offers po left join public.merchants m on m.id=po.merchant_id where m.id is null) as offers_without_merchant;
