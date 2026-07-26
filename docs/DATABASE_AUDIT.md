# HypeBuzz Database and Migration Audit

Date: 2026-07-26  
Phase: 1 — Database and migration audit  
Scope: repository migrations `001`–`019`, application dependencies, local TypeScript database types, and read-only production API observations.

## Executive finding and go/no-go

**No-go for production mutation work in Phase 2 until the SQL verification is run and reviewed.** The repository has a coherent intended migration order, but the deployed database demonstrably does not match that cumulative schema. It is not merely one migration behind: public, read-only PostgREST probes show objects from migrations 010, 012, and 017 while objects from 008, 009, 011, 013, 014, 018, and 019 are absent. Migration 016 could not be verified without authenticated catalog access.

No migration was applied and no production data was changed during this audit. Historical migrations were not edited.

The repository also contains two confirmed defects independent of production state:

1. Migration 019 changes the publication-readiness contract, but does not update `save_product_with_offer` from migration 016. The save RPC still rejects a null `original_price` and `pre_order`, while the final readiness function permits them. The two atomic write paths therefore disagree.
2. The public read policies in migrations 017 and 018 combine a public predicate with an `admin_users` subquery in one policy granted to `anon`. Production returns `permission denied for table admin_users` for the knowledge-hub public read. The analogous product-image and storage policies have the same unsafe assumption. Public and admin read policies must be split in a new forward migration.

## 1. Expected schema inventory

This is the cumulative state after migrations 001–019, not a claim about production.

### Tables and columns

| Table | Expected columns | Keys and notable checks |
|---|---|---|
| `categories` | `id uuid`, `name text`, `slug text`, `description text?`, `image_url text?`, `is_active boolean=true`, `created_at timestamptz=now()`, `updated_at timestamptz=now()`, `display_order integer=0` | PK `id`; unique `name`, `slug`; nonblank name, slug format, nonnegative display order |
| `brands` | `id`, `name`, `slug`, `logo_url?`, `is_active=true`, timestamps, `description?`, `website_url?` | PK; unique name/slug; name and slug checks |
| `products` | `id`, `name`, `slug`, `amazon_asin?`, `short_description?`, `description?`, `category_id?`, `brand_id?`, `primary_image_url?`, `specifications jsonb={}`, `status='draft'`, `is_featured=false`, `is_trending=false`, timestamps | PK; unique slug; partial unique ASIN; category/brand FKs use `ON DELETE SET NULL`; name, slug, ASIN, JSON-object, and status checks |
| `merchants` | `id`, `name`, `slug`, `logo_url?`, `website_url?`, `is_active=true`, timestamps, `affiliate_network='Other'`, `affiliate_tracking_parameter?` | PK; unique name/slug; name, slug, and nonblank network checks |
| `product_offers` | `id`, `product_id`, `merchant_id`, `affiliate_url`, `current_price numeric(12,2)`, `original_price?`, `currency='INR'`, `availability='in_stock'`, `coupon_note?`, `is_active=true`, `last_checked_at=now()`, timestamps, `offer_title?`, `shipping_note?` | PK; unique product/merchant; cascade product/merchant FKs; URL, nonnegative price, currency, availability, and text-length checks |
| `admin_users` | `user_id`, `role='admin'`, `is_active=true`, `created_at=now()` | PK/FK to `auth.users` with cascade delete; admin-role check |
| `affiliate_clicks` | `id`, nullable offer/product/merchant FKs, `clicked_at`, `referrer?`, `user_agent?`, `device_type?`, `source_page?`, `session_id?`, `ip_hash?`, `created_at` | PK; FKs use `ON DELETE SET NULL`; device check |
| `blog_categories` | `id`, `name`, `slug`, `description?`, timestamps | PK; unique slug; name/slug checks |
| `blog_posts` | `id`, `title`, `slug`, `excerpt?`, `content?`, `cover_image_url?`, `author_name?`, `category_id?`, `status='draft'`, `featured=false`, `seo_title?`, `seo_description?`, `published_at?`, timestamps | PK; unique slug; category FK set null; publication, status, slug, title, and SEO-length checks |
| `blog_tags` | `id`, `name`, `slug`, timestamps | PK; unique slug; name/slug checks |
| `blog_post_tags` | `post_id`, `tag_id` | Composite PK; both FKs cascade |
| `knowledge_hub_items` | `id`, `title`, `slug`, `description`, `category`, `tags text[]={}`, `author_name?`, `pdf_url`, `pdf_storage_path`, `thumbnail_url?`, `thumbnail_storage_path?`, `pdf_size_bytes bigint`, `status='draft'`, `published_at?`, timestamps | PK; unique slug; nonblank, slug, status, PDF-size, and published-date checks |
| `product_images` | `id`, `product_id`, `image_url`, `storage_path?`, `source_type`, `alt_text?`, `sort_order=0`, `is_primary=false`, `created_at` | PK; product FK cascade; source/storage, URL, source type, and nonnegative order checks; one-primary partial unique index |

Question marks mean nullable. Full expected/actual column reporting is encoded in [`verify_production_schema.sql`](../supabase/verification/verify_production_schema.sql).

### Indexes

- Core catalog: category display order/name; product category, brand, status/date, partial ASIN, featured, and trending; offer active product/price, merchant, and last-checked indexes. PK and unique constraints also create indexes.
- Analytics: affiliate click indexes on `clicked_at`, `offer_id`, `product_id`, and `merchant_id`.
- Blog: post category, status/published date, partial featured/published, and post-tag tag ID.
- Knowledge hub: slug, status, category, and published date. Migration 017 has both a unique slug constraint index and a separate slug index, which is redundant but not unsafe.
- Images: product/sort order and one-primary-per-product partial unique index.

### Foreign keys and delete behavior

- Product category and brand: set null.
- Offer product and merchant: cascade.
- Admin user to `auth.users`: cascade.
- Affiliate click references: set null, preserving analytics.
- Blog post category: set null; post-tag links: cascade.
- Product image product: cascade.

### Functions, RPCs, and triggers

| Object | Purpose | Security |
|---|---|---|
| `set_updated_at()` | Shared timestamp trigger | invoker/default |
| `search_products(11 args)` | Public filtered product search | stable, invoker; execute anon/authenticated |
| `search_category_products(13 args)` | Category search with `total_count` | stable, invoker; execute anon/authenticated |
| `get_affiliate_click_summary()` | Admin analytics JSON | stable, invoker; execute authenticated only |
| `assert_product_is_storefront_ready(uuid)` | Publication invariant | invoker/default |
| two `enforce_*_storefront_ready()` trigger functions | Invoke readiness checks | invoker/default |
| `save_product_with_offer(17 args)` | Product plus first offer atomic write | invoker; execute authenticated |
| `delete_failed_product(uuid)` | Cleanup after failed image workflow | security definer with explicit active-admin check |
| `replace_product_images(uuid,jsonb)` | Atomic image replacement | security definer with explicit active-admin check |
| `replace_product_offers(uuid,jsonb)` | Atomic offer replacement | invoker; RLS and grants remain active |

Updated-at triggers cover the five core tables, blog categories/posts/tags, and knowledge-hub items. Deferred constraint triggers on products and offers enforce the storefront invariant at transaction end.

### Grants and RLS

All 13 public tables enable RLS in the cumulative repository state. Anonymous users receive SELECT only where public content is intended. Authenticated users receive table privileges needed by admin operations, while policies require an active `admin_users` row for writes. There are no intended public writes. Affiliate click inserts are performed by the server-only secret client; anon/authenticated insert is deliberately not granted.

The verification script reports all effective anon/authenticated table grants and PUBLIC/anon/authenticated routine grants so unexpected privileges are visible. Function execution must be checked carefully because PostgreSQL functions are executable by `PUBLIC` unless explicitly revoked.

### Storage

| Bucket | Public flag | Limit | MIME types |
|---|---:|---:|---|
| `knowledge-hub-pdfs` | false | 25 MiB | PDF |
| `knowledge-hub-thumbnails` | false | 5 MiB | JPEG, PNG, WebP |
| `product-images` | false | 5 MiB | JPEG, PNG, WebP |

Knowledge-hub storage has admin insert/update/delete policies. Product images have admin insert/delete policies but no storage-object UPDATE policy; current replacement logic uploads new objects rather than updating an existing object. Both areas have conditional published-read policies.

## 2. Application dependency inventory

Application queries reference these public tables: `admin_users`, `affiliate_clicks`, all four blog tables, `brands`, `categories`, `knowledge_hub_items`, `merchants`, `product_images`, `product_offers`, and `products`. All have a repository migration.

Application RPC calls are `get_affiliate_click_summary`, `save_product_with_offer`, `delete_failed_product`, `replace_product_images`, and `replace_product_offers`. The repository also defines `search_products` and `search_category_products`, but current application search/category data modules use direct Supabase reads and application-side composition rather than those RPCs.

Application storage dependencies are exactly `knowledge-hub-pdfs`, `knowledge-hub-thumbnails`, and `product-images`.

Environment inspection found the intended names in use: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and the server-only `SUPABASE_SECRET_KEY`. The secret key is not referenced by browser client code. No application dependency on legacy `ANON_KEY`, `SERVICE_ROLE_KEY`, or unprefixed URL names was found.

## 3. Migration dependency graph

### Migration-by-migration inventory

| Migration | Cumulative contribution |
|---|---|
| 001 | `pgcrypto`; five core tables; core constraints/indexes; `set_updated_at`; five timestamp triggers; public SELECT grants/policies; merchant seeds |
| 002 | `admin_users`, auth FK, RLS, own-active-role SELECT policy/grant |
| 003 | Active-admin SELECT policies on all five core catalog tables |
| 004 | Product INSERT/UPDATE grant and active-admin policies |
| 005 | Category INSERT/UPDATE grant and active-admin policies |
| 006 | Offer INSERT/UPDATE grant and active-admin policies |
| 007 | Brand INSERT/UPDATE grant and active-admin policies |
| 008 | `categories.display_order`, nonnegative check, ordering index |
| 009 | `brands.description` and `brands.website_url` |
| 010 | Merchant affiliate fields/check plus active-admin INSERT/UPDATE grant/policies |
| 011 | Public `search_products` RPC and execute grants |
| 012 | `affiliate_clicks`, analytics indexes/RLS/admin read, summary RPC/grant |
| 013 | Public `search_category_products` RPC and execute grants |
| 014 | Four blog tables, constraints/indexes/triggers, grants, public reads, admin CRUD policies |
| 015 | Restores product INSERT/UPDATE table privileges needed by existing policies |
| 016 | Read/write grants, publication-readiness function and deferred triggers, atomic `save_product_with_offer`; also downgrades invalid published rows |
| 017 | Knowledge-hub table/indexes/trigger/RLS; two private buckets and storage policies |
| 018 | Product-images table/indexes/RLS; private image bucket; cleanup and image-replacement RPCs |
| 019 | Offer editorial fields/checks, admin DELETE, offer-replacement RPC, revised readiness function |

```text
001 core catalog + set_updated_at
 ├─002 admin_users
 │  ├─003 admin catalog reads ─┬─004 products writes ─015 grant repair─┐
 │  │                         ├─005 categories writes                 │
 │  │                         ├─006 offers writes                     ├─016 atomic publication
 │  │                         └─007 brands writes                     │     ├─018 product images
 │  ├─010 merchant fields/writes                                     │     └─019 offer replacement + revised readiness
 │  ├─012 affiliate analytics                                        │
 │  ├─014 blog (also needs 001 set_updated_at)                        │
 │  └─017 knowledge hub (also needs storage + set_updated_at)         │
 ├─008 category display order
 ├─009 brand editorial fields
 ├─011 public search
 └─013 category search
```

Numeric order remains the only safe assumed execution order. Migration 019 depends on both the offer table and the readiness function created by 016. Migration 018 depends on the product table, `admin_users`, storage, and authenticated admin behavior.

## 4. Known schema drift and repository inconsistencies

### Confirmed repository inconsistencies

- Local `Database` types omitted `categories.display_order` even though migration 008 and category data code expect it. The local type was corrected in this phase.
- Local function types omitted repository functions not currently invoked directly. Signatures for search/readiness/trigger functions were added. The file is manually curated, not a fresh Supabase CLI generation: relationship arrays are empty and its generic insert shape does not model every database default accurately. A fresh generation should replace it only after production is reconciled.
- Migration 019 supersedes the readiness rules from 016 but not the 016 save RPC validation. This can make the new multi-offer edit path accept a publication state that the single-offer create path rejects.
- Migration 019's duplicate-merchant error says “active offers,” but its grouping checks all submitted offers, active and inactive.
- Migration 017 creates a redundant non-unique slug index in addition to the unique slug constraint.
- Migration 018 uses security-definer functions appropriately guarded by an active-admin lookup, but `replace_product_images` relies on the later FK failure rather than explicitly reporting a missing product.
- The combined public/admin read predicates in 017 and 018 can force anonymous evaluation of `admin_users`; this is confirmed broken for deployed knowledge-hub reads.

### Objects in code but not migrations

None found for public tables, called RPCs, or storage buckets.

### Objects in migrations but not meaningfully used by code

The two public search RPCs are present in migrations and now represented in local types, but the current public search implementation does not call them. This is not inherently wrong, but their deployed absence proves migration drift and means they cannot be relied on in later phases without verification.

## 5. Suspected and observed production drift

The following observations used only the production publishable key and read-only GET/RPC requests. HTTP OPTIONS responses were deliberately not treated as proof that a mutation RPC exists.

| Probe | Result | Interpretation |
|---|---|---|
| Base category columns | HTTP 200; `Mobiles` returned | Migration 001 category exists |
| `categories.display_order` | HTTP 400 / PostgreSQL `42703` | Migration 008 absent |
| `brands.description,website_url` | HTTP 400 / `42703` | Migration 009 absent |
| Merchant affiliate fields | HTTP 200 | Migration 010 present |
| `search_products` RPC | HTTP 404 / `PGRST202` | Migration 011 absent or schema cache lacks it |
| Affiliate summary RPC | HTTP 401 permission denied | Migration 012 object exists; anonymous execution correctly denied |
| `search_category_products` RPC | HTTP 404 / `PGRST202` | Migration 013 absent or schema cache lacks it |
| Blog tables | HTTP 404 / `PGRST205` | Migration 014 absent or not exposed |
| Knowledge-hub table | HTTP 401, permission denied for `admin_users` | Migration 017 exists; public policy is defective |
| `product_images` | HTTP 404 / `PGRST205` | Migration 018 absent or not exposed |
| Offer 019 columns | HTTP 400 / `42703` | Migration 019 absent |
| `admin_users` and `affiliate_clicks` | HTTP 401 permission denied | Tables exist; public denial is expected |

Production migration 016 remains **unknown**: its write RPCs and deferred triggers cannot be safely proven through anonymous REST calls. Catalog-level SQL verification is required.

## 6. Safe production verification SQL

Run [`supabase/verification/verify_production_schema.sql`](../supabase/verification/verify_production_schema.sql) in Supabase Dashboard → SQL Editor as a database owner. It consists only of SELECT statements and reports:

1. execution context;
2. missing tables;
3. missing/type-mismatched columns plus actual defaults;
4. missing or signature-mismatched functions and security-definer status;
5. missing indexes;
6. missing triggers;
7. missing policies plus their definitions;
8. RLS state;
9. missing/mismatched buckets;
10. key constraints;
11. actual table and routine grants;
12. the actual relevant public columns.

Export every result set as CSV or copy the grid output. Do not run any historical migration in response to a single missing row.

## 7. Proposed corrective migration plan

No corrective migration is created in this audit because the complete production catalog has not been supplied.

After verification, create new, idempotent forward migrations rather than modifying 001–019:

1. **Production reconciliation migration:** add only proven-missing columns, constraints, indexes, tables, and buckets using guarded catalog checks. Preserve rows and backfill non-null columns before validation. Do not replay migration 016's historical published-product downgrade without an explicit data review.
2. **Public/admin policy split:** replace the combined policies from 017/018 with one public published-only SELECT policy and a separate authenticated active-admin SELECT policy, including storage policies. Keep all write policies admin-only.
3. **Publication contract correction (Phase 2):** make `save_product_with_offer`, `replace_product_offers`, readiness checks, and UI validation share one availability/original-price contract. Add transaction/RPC tests.
4. **Regenerate types:** generate types from the reconciled database and review the diff, replacing the manual relationship/default approximations.

Each migration should run first against a restored/staging copy, inside a transaction where supported, with pre/post verification output retained.

## 8. Rollback considerations

- Take a Supabase backup/PITR checkpoint before corrective SQL.
- Prefer additive changes. Adding nullable columns or columns with safe defaults is reversible at application level without dropping data.
- Use `NOT VALID` then `VALIDATE CONSTRAINT` where existing data may violate a new check or FK.
- Policy changes should be transactional and retain an authenticated admin path throughout. Keep the prior definitions in the deployment record for immediate restoration.
- Function replacement rollback requires retaining the exact prior `pg_get_functiondef` output and grants.
- Do not drop newly discovered production-only objects until ownership and usage are proven.
- Bucket creation is reversible operationally, but bucket/object deletion is not part of this plan.

## 9. Manual Supabase dashboard checks

- Run and export the verification SQL result sets.
- Check Dashboard → Database → Migrations/history for every migration identifier and execution timestamp; repository filenames alone are not authoritative.
- Inspect authentication for the intended admin UUID and confirm exactly one active `admin_users` row with role `admin`.
- Review API logs for `42703`, `PGRST202`, `PGRST205`, and `permission denied for table admin_users` around affected routes.
- Verify storage bucket privacy, limits, MIME types, and policy definitions.
- Confirm Vault/secrets and project settings do not expose the server secret. Do not paste secret values into test evidence.
- Inventory production-only tables/functions/columns returned by the catalog before drafting reconciliation SQL.
- On staging, test anon published reads, anon draft denial, authenticated admin reads/writes, and authenticated non-admin denial.

## 10. Phase 2 gate

**Current recommendation: NO-GO for production Phase 2 changes.** Proceed only after the verification output confirms the exact 016 function/trigger state and all production-only drift is understood. Repository-only design and tests may be prepared, but the next production migration must be based on catalog evidence rather than inferred migration order.

The immediate next prompt should provide the exported verification results and request an idempotent reconciliation plan/migration review. It should explicitly continue Phase 1 verification; it should not yet authorize Phase 2.
