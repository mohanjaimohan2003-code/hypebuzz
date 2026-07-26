# Categories admin repair

## Root cause

The `/admin/categories` list query selected and ordered by `public.categories.display_order`. The deployed table does not have that column. A read-only request against the configured Supabase project reproduced the production failure as HTTP 400 with PostgreSQL code `42703` and message `column categories.display_order does not exist`.

The base schema in `001_initial_schema.sql` defines `id`, `name`, `slug`, `description`, `image_url`, `is_active`, `created_at`, and `updated_at`. It does not define `display_order`, `sort_order`, or `parent_id`. A later repository migration, `008_add_category_display_order.sql`, adds `display_order`, but it has not been applied to the deployed project. The application had incorrectly treated that optional later column as part of the deployed schema.

## Why Add Product worked

Add Product uses the same cookie-aware Supabase server client and the same `getAdminAccess` authorization path. Its category query selects only `id`, `name`, and `is_active`, filters active rows, and orders by `name`. Those columns exist, so Supabase returns the active Mobiles row.

The Categories screen selected `id`, `name`, `slug`, `is_active`, `display_order`, `updated_at`, and `products(count)`, then ordered by `display_order`. Supabase rejects the whole query when any selected or ordered column is missing. The nested product count is valid: the same live query without `display_order` returned Mobiles with its product count.

## Repair

- Removed `display_order` from admin category list, editor, create, and update code.
- Categories now order alphabetically by `name`.
- Kept the valid product-count relationship, search, and active/inactive filters.
- Added structured server-side category query and mutation logging for error code, message, details, hint, and HTTP status when the client exposes it.
- Replaced the misleading production UI message with a safe instruction that points operators to the structured server log.
- Duplicate name or slug violations still return the specific existing user-facing conflict message.

## Environment, authentication, and RLS

No environment-variable defect was found. Browser, server, and Proxy clients all use `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. The server-only privileged client alone reads `SUPABASE_SECRET_KEY`; it is not used or exposed by category management. No legacy Supabase variable names are referenced.

No authentication defect was found. The protected layout, category data functions, and server actions validate Supabase claims and require a matching active `admin_users` row. Proxy refreshes and forwards Supabase cookies. Reaching the page and executing the category query demonstrates that authorization completed.

No RLS change is required. Public SELECT permits active categories, active-admin SELECT permits inactive categories, and existing active-admin INSERT/UPDATE policies preserve admin-only writes. RLS was not disabled or broadened.

## Files changed

- `lib/data/admin-categories.ts`
- `app/admin/(protected)/categories/page.tsx`
- `app/admin/(protected)/categories/actions.ts`
- `app/admin/(protected)/categories/[categoryId]/edit/page.tsx`
- `components/admin/category-form.tsx`
- `components/admin/category-table.tsx`
- `lib/validation/category.ts`
- `lib/types/database.ts`
- `docs/CATEGORIES_ADMIN_FIX.md`

## Manual steps

No SQL migration is required for this repair. Deploy the application changes to Vercel, sign in as an active admin, and smoke-test list/search/status filtering plus create/edit/activate/deactivate. If display-order management is desired later, apply migration 008 deliberately and restore that UI as a separate coordinated schema-and-application change.
