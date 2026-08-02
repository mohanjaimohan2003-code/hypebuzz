-- HypeBuzz production schema verification (read-only)
-- Run the whole file in the Supabase SQL editor. Every statement is SELECT-only.
-- A status other than OK identifies an item that needs review; this script changes nothing.

select
  '00_database_context' as result_set,
  current_database() as database_name,
  current_user as executing_role,
  current_timestamp as checked_at;

with expected(table_name) as (
  values ('categories'), ('brands'), ('products'), ('merchants'),
    ('product_offers'), ('admin_users'), ('affiliate_clicks'),
    ('blog_categories'), ('blog_posts'), ('blog_tags'), ('blog_post_tags'),
    ('knowledge_hub_items'), ('product_images'), ('product_reviews')
)
select '01_tables' as result_set, e.table_name,
  case when t.table_name is null then 'MISSING' else 'OK' end as status
from expected e
left join information_schema.tables t
  on t.table_schema = 'public' and t.table_name = e.table_name
order by e.table_name;

with expected(table_name, column_name, expected_type, expected_nullable, expected_default) as (
  values
  ('categories','id','uuid','NO','gen_random_uuid()'), ('categories','name','text','NO',null),
  ('categories','slug','text','NO',null), ('categories','description','text','YES',null),
  ('categories','image_url','text','YES',null), ('categories','is_active','boolean','NO','true'),
  ('categories','display_order','integer','NO','0'), ('categories','created_at','timestamp with time zone','NO','now()'),
  ('categories','updated_at','timestamp with time zone','NO','now()'),
  ('brands','id','uuid','NO','gen_random_uuid()'), ('brands','name','text','NO',null),
  ('brands','slug','text','NO',null), ('brands','logo_url','text','YES',null),
  ('brands','description','text','YES',null), ('brands','website_url','text','YES',null),
  ('brands','is_active','boolean','NO','true'), ('brands','created_at','timestamp with time zone','NO','now()'),
  ('brands','updated_at','timestamp with time zone','NO','now()'),
  ('products','id','uuid','NO','gen_random_uuid()'), ('products','name','text','NO',null),
  ('products','slug','text','NO',null), ('products','amazon_asin','text','YES',null),
  ('products','short_description','text','YES',null), ('products','description','text','YES',null),
  ('products','category_id','uuid','YES',null), ('products','brand_id','uuid','YES',null),
  ('products','primary_image_url','text','YES',null), ('products','specifications','jsonb','NO','{}'),
  ('products','highlights','jsonb','NO','[]'), ('products','seo_title','text','YES',null),
  ('products','seo_description','text','YES',null),
  ('products','status','text','NO','draft'), ('products','is_featured','boolean','NO','false'),
  ('products','is_trending','boolean','NO','false'), ('products','created_at','timestamp with time zone','NO','now()'),
  ('products','updated_at','timestamp with time zone','NO','now()'),
  ('merchants','id','uuid','NO','gen_random_uuid()'), ('merchants','name','text','NO',null),
  ('merchants','slug','text','NO',null), ('merchants','logo_url','text','YES',null),
  ('merchants','website_url','text','YES',null), ('merchants','affiliate_network','text','NO','Other'),
  ('merchants','affiliate_tracking_parameter','text','YES',null), ('merchants','is_active','boolean','NO','true'),
  ('merchants','created_at','timestamp with time zone','NO','now()'), ('merchants','updated_at','timestamp with time zone','NO','now()'),
  ('product_offers','id','uuid','NO','gen_random_uuid()'), ('product_offers','product_id','uuid','NO',null),
  ('product_offers','merchant_id','uuid','NO',null), ('product_offers','affiliate_url','text','NO',null),
  ('product_offers','current_price','numeric','NO',null), ('product_offers','original_price','numeric','YES',null),
  ('product_offers','currency','text','NO','INR'), ('product_offers','availability','text','NO','in_stock'),
  ('product_offers','coupon_note','text','YES',null), ('product_offers','offer_title','text','YES',null),
  ('product_offers','shipping_note','text','YES',null), ('product_offers','is_active','boolean','NO','true'),
  ('product_offers','last_checked_at','timestamp with time zone','NO','now()'),
  ('product_offers','created_at','timestamp with time zone','NO','now()'), ('product_offers','updated_at','timestamp with time zone','NO','now()'),
  ('admin_users','user_id','uuid','NO',null), ('admin_users','role','text','NO','admin'),
  ('admin_users','is_active','boolean','NO','true'), ('admin_users','created_at','timestamp with time zone','NO','now()'),
  ('affiliate_clicks','id','uuid','NO','gen_random_uuid()'), ('affiliate_clicks','offer_id','uuid','YES',null),
  ('affiliate_clicks','product_id','uuid','YES',null), ('affiliate_clicks','merchant_id','uuid','YES',null),
  ('affiliate_clicks','clicked_at','timestamp with time zone','NO','now()'), ('affiliate_clicks','referrer','text','YES',null),
  ('affiliate_clicks','user_agent','text','YES',null), ('affiliate_clicks','device_type','text','YES',null),
  ('affiliate_clicks','source_page','text','YES',null), ('affiliate_clicks','session_id','text','YES',null),
  ('affiliate_clicks','ip_hash','text','YES',null), ('affiliate_clicks','created_at','timestamp with time zone','NO','now()'),
  ('blog_categories','id','uuid','NO','gen_random_uuid()'), ('blog_categories','name','text','NO',null),
  ('blog_categories','slug','text','NO',null), ('blog_categories','description','text','YES',null),
  ('blog_categories','created_at','timestamp with time zone','NO','now()'),
  ('blog_categories','updated_at','timestamp with time zone','NO','now()'),
  ('blog_posts','id','uuid','NO','gen_random_uuid()'), ('blog_posts','title','text','NO',null),
  ('blog_posts','slug','text','NO',null), ('blog_posts','excerpt','text','YES',null),
  ('blog_posts','content','text','YES',null), ('blog_posts','cover_image_url','text','YES',null),
  ('blog_posts','author_name','text','YES',null),
  ('blog_posts','category_id','uuid','YES',null), ('blog_posts','status','text','NO','draft'),
  ('blog_posts','featured','boolean','NO','false'), ('blog_posts','seo_title','text','YES',null),
  ('blog_posts','seo_description','text','YES',null), ('blog_posts','published_at','timestamp with time zone','YES',null),
  ('blog_posts','created_at','timestamp with time zone','NO','now()'), ('blog_posts','updated_at','timestamp with time zone','NO','now()'),
  ('blog_tags','id','uuid','NO','gen_random_uuid()'), ('blog_tags','name','text','NO',null),
  ('blog_tags','slug','text','NO',null), ('blog_tags','created_at','timestamp with time zone','NO','now()'),
  ('blog_tags','updated_at','timestamp with time zone','NO','now()'),
  ('blog_post_tags','post_id','uuid','NO',null), ('blog_post_tags','tag_id','uuid','NO',null),
  ('knowledge_hub_items','id','uuid','NO','gen_random_uuid()'), ('knowledge_hub_items','title','text','NO',null),
  ('knowledge_hub_items','slug','text','NO',null), ('knowledge_hub_items','description','text','NO',null),
  ('knowledge_hub_items','category','text','NO',null), ('knowledge_hub_items','tags','ARRAY','NO','{}'),
  ('knowledge_hub_items','author_name','text','YES',null), ('knowledge_hub_items','pdf_url','text','NO',null),
  ('knowledge_hub_items','pdf_storage_path','text','NO',null), ('knowledge_hub_items','thumbnail_url','text','YES',null),
  ('knowledge_hub_items','thumbnail_storage_path','text','YES',null), ('knowledge_hub_items','pdf_size_bytes','bigint','NO',null),
  ('knowledge_hub_items','status','text','NO','draft'),
  ('knowledge_hub_items','published_at','timestamp with time zone','YES',null),
  ('knowledge_hub_items','created_at','timestamp with time zone','NO','now()'), ('knowledge_hub_items','updated_at','timestamp with time zone','NO','now()'),
  ('product_images','id','uuid','NO','gen_random_uuid()'), ('product_images','product_id','uuid','NO',null),
  ('product_images','image_url','text','NO',null), ('product_images','storage_path','text','YES',null),
  ('product_images','source_type','text','NO',null), ('product_images','alt_text','text','YES',null),
  ('product_images','sort_order','integer','NO','0'), ('product_images','is_primary','boolean','NO','false'),
  ('product_images','created_at','timestamp with time zone','NO','now()'),
  ('product_reviews','id','uuid','NO','gen_random_uuid()'), ('product_reviews','product_id','uuid','NO',null),
  ('product_reviews','user_id','uuid','YES',null), ('product_reviews','reviewer_name','text','NO',null),
  ('product_reviews','rating','smallint','NO',null), ('product_reviews','title','text','YES',null),
  ('product_reviews','review_text','text','NO',null), ('product_reviews','is_verified_buyer','boolean','NO','false'),
  ('product_reviews','status','text','NO','pending'), ('product_reviews','helpful_count','integer','NO','0'),
  ('product_reviews','unhelpful_count','integer','NO','0'), ('product_reviews','created_at','timestamp with time zone','NO','now()'),
  ('product_reviews','updated_at','timestamp with time zone','NO','now()')
)
select '02_columns' as result_set, e.table_name, e.column_name, e.expected_type,
  c.data_type as actual_type, e.expected_nullable, c.is_nullable as actual_nullable,
  e.expected_default, c.column_default as actual_default,
  case when c.column_name is null then 'MISSING'
       when c.data_type <> e.expected_type or c.is_nullable <> e.expected_nullable then 'MISMATCH'
       else 'OK' end as status
from expected e
left join information_schema.columns c on c.table_schema='public'
 and c.table_name=e.table_name and c.column_name=e.column_name
order by e.table_name, e.column_name;

with expected(function_name, identity_arguments) as (
  values
  ('set_updated_at',''),
  ('search_products','text, text, text, text, numeric, numeric, numeric, text, boolean, text, integer'),
  ('search_category_products','text, text, text, text, numeric, numeric, numeric, text, boolean, boolean, boolean, text, integer'),
  ('get_affiliate_click_summary',''),
  ('assert_product_is_storefront_ready','uuid'),
  ('enforce_product_storefront_ready',''), ('enforce_offer_product_storefront_ready',''),
  ('save_product_with_offer','uuid, text, text, text, uuid, text, boolean, boolean, text, uuid, uuid, text, numeric, numeric, text, text, boolean'),
  ('delete_failed_product','uuid'), ('replace_product_images','uuid, jsonb'),
  ('replace_product_offers','uuid, jsonb'),
  ('create_product_with_images_and_offers','jsonb, jsonb, jsonb'),
  ('permanently_delete_archived_product','uuid'),
  ('require_product_image_before_publish',''),
  ('save_product_workflow','uuid, jsonb, jsonb, jsonb'),
  ('can_read_published_product_image_object','text'),
  ('can_read_published_knowledge_asset','text, text'),
  ('get_product_review_summary','uuid')
), actual as (
  select p.proname, oidvectortypes(p.proargtypes) as identity_arguments,
    p.prosecdef as security_definer
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public'
)
select '03_functions' as result_set, e.function_name, e.identity_arguments as expected_arguments,
  a.identity_arguments as actual_arguments, a.security_definer,
  case when a.proname is null then 'MISSING'
       when a.identity_arguments <> e.identity_arguments then 'SIGNATURE_MISMATCH'
       else 'OK' end as status
from expected e left join actual a on a.proname=e.function_name
order by e.function_name, a.identity_arguments;

with expected(index_name) as (
  values ('categories_pkey'), ('categories_name_key'), ('categories_slug_key'),
  ('categories_display_order_name_idx'), ('brands_pkey'), ('brands_name_key'), ('brands_slug_key'),
  ('products_pkey'), ('products_slug_key'), ('products_amazon_asin_unique_idx'),
  ('products_category_id_idx'), ('products_brand_id_idx'), ('products_status_created_at_idx'),
  ('products_featured_published_idx'), ('products_trending_published_idx'), ('merchants_pkey'), ('merchants_name_key'),
  ('merchants_slug_key'), ('product_offers_pkey'), ('product_offers_product_id_merchant_id_key'),
  ('product_offers_product_active_idx'), ('product_offers_merchant_id_idx'), ('product_offers_last_checked_at_idx'),
  ('admin_users_pkey'), ('affiliate_clicks_pkey'), ('affiliate_clicks_clicked_at_idx'),
  ('affiliate_clicks_offer_id_idx'), ('affiliate_clicks_product_id_idx'), ('affiliate_clicks_merchant_id_idx'),
  ('blog_categories_pkey'), ('blog_categories_slug_key'), ('blog_posts_pkey'), ('blog_posts_slug_key'),
  ('blog_posts_status_published_at_idx'), ('blog_posts_category_id_idx'), ('blog_posts_featured_published_idx'),
  ('blog_tags_pkey'), ('blog_tags_slug_key'), ('blog_post_tags_pkey'), ('blog_post_tags_tag_id_idx'),
  ('knowledge_hub_items_pkey'), ('knowledge_hub_items_slug_key'), ('knowledge_hub_items_slug_idx'), ('knowledge_hub_items_status_idx'),
  ('knowledge_hub_items_category_idx'), ('knowledge_hub_items_published_at_idx'), ('product_images_pkey'),
  ('product_images_product_order_idx'), ('product_images_one_primary_idx'),
  ('product_reviews_pkey'), ('product_reviews_product_id_idx'), ('product_reviews_status_idx'),
  ('product_reviews_created_at_idx'), ('product_reviews_rating_idx'), ('product_reviews_public_page_idx')
)
select '04_indexes' as result_set, e.index_name, i.tablename, i.indexdef,
  case when i.indexname is null then 'MISSING' else 'OK' end as status
from expected e left join pg_indexes i on i.schemaname='public' and i.indexname=e.index_name
order by e.index_name;

with expected(table_name, trigger_name) as (
  values ('categories','categories_set_updated_at'), ('brands','brands_set_updated_at'),
  ('products','products_set_updated_at'), ('merchants','merchants_set_updated_at'),
  ('product_offers','product_offers_set_updated_at'), ('blog_categories','blog_categories_set_updated_at'),
  ('blog_posts','blog_posts_set_updated_at'), ('blog_tags','blog_tags_set_updated_at'),
  ('knowledge_hub_items','knowledge_hub_items_set_updated_at'),
  ('products','products_storefront_ready'), ('product_offers','offers_keep_product_storefront_ready'),
  ('products','require_product_image_before_publish'), ('product_reviews','product_reviews_set_updated_at')
)
select '05_triggers' as result_set, e.table_name, e.trigger_name,
  case when t.trigger_name is null then 'MISSING' else 'OK' end as status
from expected e left join information_schema.triggers t on t.event_object_schema='public'
 and t.event_object_table=e.table_name and t.trigger_name=e.trigger_name
order by e.table_name, e.trigger_name;

with expected(table_name, policy_name) as (
  values
  ('categories','Public can read active categories'), ('categories','Active admins can read all categories'),
  ('categories','Active admins can create categories'), ('categories','Active admins can update categories'),
  ('brands','Public can read active brands'), ('brands','Active admins can read all brands'),
  ('brands','Active admins can create brands'), ('brands','Active admins can update brands'),
  ('products','Public can read published products'), ('products','Active admins can read all products'),
  ('products','Active admins can create products'), ('products','Active admins can update products'),
  ('merchants','Public can read active merchants'), ('merchants','Active admins can read all merchants'),
  ('merchants','Active admins can create merchants'), ('merchants','Active admins can update merchants'),
  ('product_offers','Public can read eligible product offers'), ('product_offers','Active admins can read all product offers'),
  ('product_offers','Active admins can create product offers'), ('product_offers','Active admins can update product offers'),
  ('product_offers','Active admins can delete product offers'), ('admin_users','Admins can read their own active role'),
  ('affiliate_clicks','Active admins can read affiliate clicks'),
  ('blog_categories','Public can read blog categories'), ('blog_posts','Public can read published blog posts'),
  ('blog_tags','Public can read blog tags'), ('blog_post_tags','Public can read published blog post tags'),
  ('blog_categories','Active admins can manage blog categories'), ('blog_posts','Active admins can manage blog posts'),
  ('blog_tags','Active admins can manage blog tags'), ('blog_post_tags','Active admins can manage blog post tags'),
  ('knowledge_hub_items','Public can read published knowledge hub items'),
  ('knowledge_hub_items','Active admins can manage knowledge hub items'),
  ('product_images','Public can read complete published product images'), ('product_images','Active admins manage product images'),
  ('objects','Published knowledge hub assets are readable'), ('objects','Active admins can upload knowledge hub assets'),
  ('objects','Active admins can update knowledge hub assets'), ('objects','Active admins can delete knowledge hub assets'),
  ('objects','Published product image objects are readable'), ('objects','Active admins can upload product image files'),
  ('objects','Active admins can update product image files'), ('objects','Active admins can delete product image files'),
  ('product_reviews','Public can read approved product reviews'),
  ('product_reviews','Active admins can read all product reviews'),
  ('product_reviews','Active admins can moderate product reviews'),
  ('product_reviews','Active admins can delete product reviews')
)
select '06_policies' as result_set, e.table_name, e.policy_name, p.schemaname,
  p.cmd, p.roles, p.qual, p.with_check,
  case when p.policyname is null then 'MISSING' else 'OK_REVIEW_DEFINITION' end as status
from expected e left join pg_policies p on p.tablename=e.table_name and p.policyname=e.policy_name
 and p.schemaname in ('public','storage')
order by e.table_name, e.policy_name;

with expected(table_name) as (
  values ('categories'), ('brands'), ('products'), ('merchants'), ('product_offers'),
  ('admin_users'), ('affiliate_clicks'), ('blog_categories'), ('blog_posts'), ('blog_tags'),
  ('blog_post_tags'), ('knowledge_hub_items'), ('product_images'), ('product_reviews')
)
select '07_rls' as result_set, e.table_name, c.relrowsecurity as rls_enabled,
  case when c.oid is null then 'TABLE_MISSING' when c.relrowsecurity then 'OK' else 'RLS_DISABLED' end as status
from expected e left join (
  select c.* from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public'
) c on c.relname=e.table_name
order by e.table_name;

with expected(bucket_id, public, file_size_limit) as (
  values ('knowledge-hub-pdfs',false,26214400::bigint),
    ('knowledge-hub-thumbnails',false,5242880::bigint), ('product-images',false,5242880::bigint)
)
select '08_storage_buckets' as result_set, e.bucket_id, e.public as expected_public,
  b.public as actual_public, e.file_size_limit as expected_limit, b.file_size_limit as actual_limit,
  b.allowed_mime_types,
  case when b.id is null then 'MISSING'
       when b.public<>e.public or b.file_size_limit<>e.file_size_limit then 'MISMATCH'
       else 'OK' end as status
from expected e left join storage.buckets b on b.id=e.bucket_id
order by e.bucket_id;

with expected(table_name, constraint_name, constraint_type) as (
  values ('categories','categories_name_not_blank','CHECK'), ('categories','categories_slug_format','CHECK'),
  ('categories','categories_display_order_nonnegative','CHECK'), ('products','products_status_allowed','CHECK'),
  ('products','products_category_id_fkey','FOREIGN KEY'), ('products','products_brand_id_fkey','FOREIGN KEY'),
  ('product_offers','product_offers_product_id_fkey','FOREIGN KEY'),
  ('product_offers','product_offers_merchant_id_fkey','FOREIGN KEY'),
  ('product_offers','product_offers_availability_allowed','CHECK'),
  ('admin_users','admin_users_user_id_fkey','FOREIGN KEY'), ('admin_users','admin_users_role_allowed','CHECK'),
  ('affiliate_clicks','affiliate_clicks_device_type_allowed','CHECK'),
  ('blog_posts','blog_posts_category_id_fkey','FOREIGN KEY'), ('blog_posts','blog_posts_status_allowed','CHECK'),
  ('blog_post_tags','blog_post_tags_post_id_fkey','FOREIGN KEY'), ('blog_post_tags','blog_post_tags_tag_id_fkey','FOREIGN KEY'),
  ('knowledge_hub_items','knowledge_hub_status_allowed','CHECK'),
  ('product_images','product_images_product_id_fkey','FOREIGN KEY'), ('product_images','product_images_source_allowed','CHECK'),
  ('product_reviews','product_reviews_product_id_fkey','FOREIGN KEY'), ('product_reviews','product_reviews_user_id_fkey','FOREIGN KEY'),
  ('product_reviews','product_reviews_rating_range','CHECK'), ('product_reviews','product_reviews_status_allowed','CHECK')
)
select '09_constraints' as result_set, e.table_name, e.constraint_name, e.constraint_type,
  tc.constraint_type as actual_type,
  case when tc.constraint_name is null then 'MISSING'
       when tc.constraint_type<>e.constraint_type then 'MISMATCH' else 'OK' end as status
from expected e left join information_schema.table_constraints tc
 on tc.table_schema='public' and tc.table_name=e.table_name and tc.constraint_name=e.constraint_name
order by e.table_name, e.constraint_name;

-- Review all effective public-schema grants. Unexpected anon/authenticated write grants are launch blockers.
select '10_table_grants' as result_set, table_schema, table_name, grantee, privilege_type
from information_schema.role_table_grants
where table_schema='public' and grantee in ('anon','authenticated')
order by table_name, grantee, privilege_type;

-- Review routine execution grants and compare exact signatures with result set 03.
select '11_routine_grants' as result_set, routine_schema, routine_name, grantee, privilege_type
from information_schema.role_routine_grants
where routine_schema='public' and grantee in ('PUBLIC','anon','authenticated')
order by routine_name, grantee;

-- Detect repository-relevant public columns not represented in the expected inventory above.
select '12_actual_public_schema' as result_set, table_name, column_name, data_type,
  is_nullable, column_default
from information_schema.columns
where table_schema='public' and table_name in (
  'categories','brands','products','merchants','product_offers','admin_users','affiliate_clicks',
  'blog_categories','blog_posts','blog_tags','blog_post_tags','knowledge_hub_items','product_images','product_reviews'
)
order by table_name, ordinal_position;
-- Complete live catalog audit. Run as a database owner in the production SQL editor.
select c.table_name, c.ordinal_position, c.column_name, c.data_type, c.udt_name,
  c.is_nullable, c.column_default
from information_schema.columns c
where c.table_schema = 'public' and c.table_name in
  ('admin_users','categories','brands','merchants','products','product_offers')
order by c.table_name, c.ordinal_position;

select rel.relname as table_name, con.conname, con.contype,
  pg_get_constraintdef(con.oid) as definition
from pg_constraint con join pg_class rel on rel.oid = con.conrelid
join pg_namespace ns on ns.oid = rel.relnamespace
where ns.nspname = 'public' and rel.relname in
  ('admin_users','categories','brands','merchants','products','product_offers')
order by rel.relname, con.contype, con.conname;

select table_name, grantee, privilege_type from information_schema.role_table_grants
where table_schema = 'public' and table_name in
  ('admin_users','categories','brands','merchants','products','product_offers')
order by table_name, grantee, privilege_type;

select rel.relname as table_name, rel.relrowsecurity as rls_enabled,
  rel.relforcerowsecurity as rls_forced
from pg_class rel join pg_namespace ns on ns.oid = rel.relnamespace
where ns.nspname = 'public' and rel.relname in
  ('admin_users','categories','brands','merchants','products','product_offers')
order by rel.relname;

select tablename, policyname, roles, cmd, qual, with_check from pg_policies
where schemaname = 'public' and tablename in
  ('admin_users','categories','brands','merchants','products','product_offers')
order by tablename, policyname;

select auth.uid() as authenticated_user_id, au.user_id, au.role, au.is_active
from public.admin_users au where au.user_id = (select auth.uid());

-- Repository migration ledger required by the current application.
with expected(version) as (values ('020'),('021'),('022'),('023'),('024'),('025'),('026'),('027'),('028'),('029'),('030'),('031'))
select '13_required_migrations' as result_set, e.version,
  case when m.version is null then 'MISSING' else 'OK' end as status
from expected e
left join supabase_migrations.schema_migrations m on m.version=e.version
order by e.version;

-- No repository feature currently requires a public view; list any production-only views for review.
select '14_public_views' as result_set, table_name as view_name, view_definition
from information_schema.views where table_schema='public' order by table_name;

-- Referential/orphan checks. Every count must be zero.
select '15_orphans' as result_set, 'product_images_without_product' as check_name, count(*) as orphan_count
from public.product_images pi left join public.products p on p.id=pi.product_id where p.id is null
union all select '15_orphans','product_offers_without_product',count(*)
from public.product_offers po left join public.products p on p.id=po.product_id where p.id is null
union all select '15_orphans','product_offers_without_merchant',count(*)
from public.product_offers po left join public.merchants m on m.id=po.merchant_id where m.id is null;
