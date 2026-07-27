# Product creation stabilisation report

## Outcome

The repository-level import/save separation and cumulative RLS/grant repair are implemented. Production is **not declared accepted**: migration 024 has not been applied and the exact acceptance product has not been created in production from this environment.

## Confirmed root causes and repairs

- Brand `42703`: importer sent live-nonexistent optional columns. Brand creation now sends only `name` and `slug`.
- Import side effect: Apply created brands. It is now local-state-only; “ASIAN will be created when this product is saved.” is shown.
- Offer `42501`: missing grant and/or RLS access. Migration 024 reconciles both independently.
- Image ghost preview: browser cleared the native `FileList` after Server Action submission while object-URL UI state survived. Stable `File[]` plus input reconstruction/removal repairs the split-brain state.
- Empty validation summary: only the generic action message was rendered. Structured errors are now listed and linked, with inline errors, section expansion, first-error scrolling/focus, and separate draft/publish modes.
- JSON/schema drift: unsupported `searchTags`, `pros`, `considerations`, `faq`, `subcategory`, and derived discount are not inserted. See `PRODUCT_JSON_DATABASE_MAPPING.md`.

## Changed files

- `components/admin/product-json-importer.tsx`
- `components/admin/product-form.tsx`
- `app/admin/(protected)/products/actions.ts` (contained pre-existing user edits; preserved and extended)
- `supabase/migrations/024_catalog_admin_workflow_security.sql`
- `supabase/verification/verify_production_schema.sql`
- the three product audit/report documents

## Manual production work

1. Run `supabase/verification/verify_production_schema.sql` as owner and archive results.
2. Compare results to the mapping; do not run rich-field writes for absent columns.
3. Apply migration 024 after review.
4. Confirm `save_product_with_offer`, cleanup/image RPCs, storage bucket policies, and migration 021 columns exist; these are outside migration 024.
5. Execute the exact ASIAN/Amazon/Sports Shoes acceptance flow while authenticated as an active admin.

## Rollback

Roll back application files using the deployment artifact preceding this change. For migration 024, revoke the added authenticated write grants and drop only policies named `Active admins can ...`; then restore the prior policies/grants captured by the verification SQL. Do not disable RLS. Product/offer rows created during acceptance should be removed only by an authorized admin after recording their IDs; storage objects should be deleted by their recorded `storage_path`.

## Acceptance evidence

- `npm run lint`: passed (2026-07-27).
- `npm test`: passed, 48/48 tests (14 publication, 20 import, 14 rich-product).
- `npm run build`: passed with Next.js 16.2.10; TypeScript and all 68 static pages completed.
- Production steps 7–15 remain unresolved because no authenticated production browser/database-owner connection was available. No rows were created and no migration was applied.
