# HypeBuzz Admin Audit

Audit date: 2026-07-25. Scope: repository code and SQL migrations through `019_price_comparison_mvp.sql`.

## Audit boundary

The local environment contains only the Supabase URL and publishable key. It has no service/secret key, database password, linked Supabase CLI project, or authenticated admin session, so PostgreSQL catalog metadata and the policies actually deployed to the remote project cannot be queried safely from this workspace. The schema below is the effective schema reconstructed from all checked-in migrations and compared with the TypeScript/database access code. The remote project must be checked against the migration history before release.

No records were deleted, the database was not reset, RLS was not disabled, and no service-role credential is used by browser code.

## Admin route inventory

| Route | Purpose | Audit result |
|---|---|---|
| `/admin/login` | Supabase password sign-in | Working client session flow; protected layout verifies admin membership |
| `/admin/access-denied` | Authenticated non-admin state | Working |
| `/admin` | Dashboard | Protected; data uses admin-scoped RLS |
| `/admin/products` | Product list/archive | Repaired data contract; archive is non-destructive |
| `/admin/products/new` | Product creation | Repaired category, brand, multi-offer, image, and error contracts |
| `/admin/products/[productId]/edit` | Product editing | Repaired brand mapping and multi-offer contract |
| `/admin/categories` | Category list/status | Working; full admin list, sorted by display order/name |
| `/admin/categories/new` | Category creation | Unique name/slug validation and revalidation present |
| `/admin/categories/[categoryId]/edit` | Category edit/activation | Working; “delete” is safely represented by deactivation |
| `/admin/brands` | Brand list/status | Working |
| `/admin/brands/new` | Brand creation | Working with unique name/slug validation |
| `/admin/brands/[brandId]/edit` | Brand edit/activation | Working; destructive deletion intentionally not added |
| `/admin/merchants` | Merchant list/status | Working |
| `/admin/merchants/new` | Merchant creation | Working |
| `/admin/merchants/[merchantId]/edit` | Merchant edit/activation | Working; merchants with offers are preserved |
| `/admin/offers` | Offer list/status | Uses offer schema added through migration 019 |
| `/admin/offers/new` | Standalone offer creation | Protected and validated |
| `/admin/offers/[offerId]/edit` | Offer editing | Protected and validated |
| `/admin/blog`, `/new`, `/[id]/edit`, `/categories`, `/tags` | Editorial administration | Protected; outside catalog repair, no blocking issue found |
| `/admin/knowledge-hub`, `/new`, `/[id]/edit` | PDF guide administration | Protected; separate storage buckets |
| `/admin/analytics` | Affiliate analytics | Protected |
| `/admin/import` | CSV import placeholder | Protected; no import mutation implemented |
| `/admin/settings` | Settings placeholder | Protected; no mutation implemented |

Every mutation file inspected performs an active-admin check inside the Server Action; route protection alone is not relied upon.

## Effective database schema

### `categories`

`id uuid PK default gen_random_uuid()`, `name text NOT NULL UNIQUE`, `slug text NOT NULL UNIQUE`, `description text NULL`, `image_url text NULL`, `display_order integer NOT NULL default 0`, `is_active boolean NOT NULL default true`, timestamps `timestamptz NOT NULL default now()`. Products reference `categories.id` with `ON DELETE SET NULL`. RLS: public reads active rows; active admins read all and insert/update. Delete remains revoked. Checks enforce nonblank name, slug format, and nonnegative display order.

### `brands`

`id uuid PK`, `name text NOT NULL UNIQUE`, `slug text NOT NULL UNIQUE`, `description text NULL`, `logo_url text NULL`, `website_url text NULL`, `is_active boolean NOT NULL default true`, timestamps. Products reference `brands.id` with `ON DELETE SET NULL`. RLS: public reads active; active admins read all and insert/update. Delete revoked. Checks enforce nonblank name and slug format.

### `merchants`

`id uuid PK`, unique required `name` and `slug`, nullable `logo_url`, required `website_url` in the TypeScript/form contract (the original SQL column is nullable), `affiliate_network text NOT NULL default 'Other'`, nullable `affiliate_tracking_parameter`, `is_active default true`, timestamps. Offers reference merchants with `ON DELETE CASCADE` and have a unique `(product_id, merchant_id)` constraint. RLS: public active read; active-admin full read/insert/update. Migration 019 adds offer delete only, not merchant delete.

### `products`

`id uuid PK`, `name text NOT NULL`, `slug text NOT NULL UNIQUE`, nullable `amazon_asin` with partial unique index, descriptions, nullable `category_id` and `brand_id` FKs (`ON DELETE SET NULL`), nullable `primary_image_url`, `specifications jsonb NOT NULL default {}`, `status text NOT NULL default draft` constrained to draft/published/archived, feature flags default false, timestamps. RLS: public published read; active-admin all read/insert/update; delete revoked except the narrowly authorized rollback RPC for failed creation.

### `product_offers`

UUID PK; required product and merchant FKs with cascade; required HTTP affiliate URL and positive `current_price`; nullable `original_price`; `currency default INR`; constrained availability; nullable `coupon_note`, `shipping_note`, `offer_title`; `is_active default true`; nullable `last_checked_at`; timestamps; unique product/merchant. RLS: eligible public read; active admins read/insert/update/delete. `replace_product_offers` validates and replaces a product’s offers inside one database transaction.

### `admin_users`

`user_id uuid PK` referencing `auth.users ON DELETE CASCADE`, `role text NOT NULL default admin` constrained to `admin`, `is_active boolean default true`, `created_at`. RLS allows an authenticated user to read only their own active admin row. This table is the authorization source for all catalog policies.

## Bugs and root causes

| Severity | Bug | Root cause | Affected files | Repair |
|---|---|---|---|---|
| Critical | Product with a visible offer failed to publish/save | UI used `offerManifest`, but validation and `save_product_with_offer` still read removed single-offer fields, sending null offer arguments | `product-form.tsx`, `product-offers-field.tsx`, `validation/product.ts`, product actions | Validate the manifest and seed the atomic publication RPC from its primary active offer |
| Critical | “Categories could not be loaded” | Remote project likely lacks migration 003/admin membership, or any combined editor query failed and was reported as a category failure | admin product data/pages; migrations 002–003 | Preserve full error state, require active admin RLS, and separate active options from editor data; verify remote migrations |
| High | Only one category visible | Deployed RLS/data state likely exposes only active public rows; code must request all appropriate rows for admin lists and all active rows for product selection without limiting | `admin-products.ts`, category migrations | Product dropdown now explicitly loads every active category, ordered by name, with no limit |
| High | Brand FK silently unavailable in product form | `products.brand_id` existed in SQL/types but was omitted from editor query, form, validation, and save | product data/form/actions/validation | Added optional brand selection, FK existence check, edit hydration, and save mapping |
| High | Partial creation after image/offer failure | Storage cannot participate in a PostgreSQL transaction | product actions; migrations 018–019 | Upload cleanup plus `delete_failed_product` rollback for newly created rows; offer replacement is transactional |
| High | Remote schema drift produces generic failures | Code relies on RPCs, product image table/bucket, and offer columns from migrations 016/018/019 | SQL migrations, product actions | Server logs full Supabase diagnostics; development response includes code/message; production remains safe |
| Medium | Product page disabled when no merchants even for a draft without offers | Submit button globally required a merchant | `product-form.tsx` | Merchant list remains needed by current offer editor; empty state is explicit; remote merchant seed/migration must exist |
| Medium | Category/brand/merchant “deletion” requested but unsafe | Rows are referenced and original policy intentionally revokes delete | management actions/migrations | Retained reversible activation/deactivation; no existing records are deleted |
| Medium | Image upload progress cannot be byte-accurate through a Server Action | Browser submits one multipart Server Action request | `product-images-field.tsx`, product actions | Pending state, per-selection validation, per-file UI errors, mobile gallery/camera inputs; true byte progress needs a signed direct-upload endpoint in a later change |
| Low | Mojibake glyphs appear in some source strings | Earlier file encoding introduced `â€¦`/`â†` | several admin components/pages | Does not block behavior; normalize encoding in a dedicated content cleanup |

## Image and storage audit

The expected bucket is private `product-images`, capped at 5,242,880 bytes and MIME-restricted to JPEG, PNG, and WebP by migration 018. Object paths are unique (`products/<product-id>/<uuid>-<safe-name>.<ext>`). Server validation checks MIME, size, count (maximum eight), manifest integrity, and file signatures. Stored upload URLs use the authenticated `/product-images/[id]` route, which creates signed URLs; external HTTP(S) URLs remain supported. The UI has separate multiple-file gallery and `capture="environment"` camera inputs with 48px-class touch targets.

Manual verification required: bucket settings and storage policies from migration 018 must be deployed. The folder policy expects the product UUID at folder segment 2, matching the generated path.

## Error and logging audit

Expected validation errors are returned through `useActionState`. Duplicate slugs map to a field message, missing category/brand references get explicit messages, permission errors mention database permissions, and image size/type errors are specific. Complete Supabase code/message/details/hint are logged server-side. Development includes the database code and message; production does not expose internal details or secrets.

## Required database work

Apply all unapplied migrations in numeric order, especially 002–010 and 015–019. No destructive migration is required by this audit. Confirm the signed-in Auth user has one active `admin_users` row. Do not add a service-role key to any `NEXT_PUBLIC_*` variable.

## Recommended repair/deployment order

1. Back up the Supabase project and compare remote migration history with local 001–019.
2. Apply missing admin membership/RLS/grant migrations 002–010 and 015.
3. Apply atomic publication, image storage, and offer migrations 016, 018, and 019.
4. Confirm one active admin row and test full category/brand/merchant reads.
5. Deploy the repaired application and execute `docs/ADMIN_TEST_CHECKLIST.md` on desktop and mobile.
