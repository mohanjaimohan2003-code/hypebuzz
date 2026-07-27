# Product creation root-cause audit

## Evidence boundary

The configured production project exposes only a publishable key. Its schema endpoint returned `401 Secret API key required`; no Supabase CLI/database connection or authenticated browser session is available. Therefore a complete live column/grant/policy dump could not be collected in this run. `supabase/verification/verify_production_schema.sql` is the required owner-level production query. Repository migrations are documented as expected state, not claimed as live state.

Confirmed production evidence supplied with the incident:

- `42703` occurred because the brand importer inserted `description` and `website_url`, absent from live `brands`.
- `42501` occurred on `public.product_offers`, proving the authenticated role lacked a table privilege and/or a passing RLS policy. PostgreSQL table grants and RLS are independent gates.

## Code-path findings

- Importer: `ProductJsonImporter.apply` invoked the `resolveOrCreateImportedBrand` Server Action. This violated the parse/preview/apply boundary and allowed Apply to write a brand.
- Form: imported fields, offer state, and image state live in separate components. Import did not intentionally touch images, but server-action submission clears the native file input.
- Image state: previews were React/object-URL state while the actual `FileList` lived in the browser-owned input. After submission the browser cleared that input, leaving the preview. The repaired component keeps authoritative `File[]` in a stable ref, rebuilds `FileList` before submit/after a failed action, and removes previews when their `File` is unavailable. There is no importer-triggered image remount in the current tree.
- Validation: the banner formerly rendered only the summary string. The form now consumes structured `validationErrors`, lists every distinct reason, opens rich/SEO sections, scrolls to and focuses the first invalid control, and does not reset state.
- Save: a cookie-aware authenticated Supabase client is reused across authorization and writes. The primary product/offer pair uses `save_product_with_offer`; the unresolved imported brand is now resolved/created only on Save. Unique slug and `(product_id, merchant_id)` constraints prevent duplicates.
- Rich fields: the action still performs a second product update for rich fields, and image/storage replacement occurs after the product/offer RPC. Cleanup RPCs reduce partial state, but only a redesigned RPC accepting all verified rich fields plus a storage-first staging protocol can make the entire requested sequence atomic. This remains gated on the live schema output.

## Expected schema versus live proof

Migrations define `admin_users(user_id, role, is_active, created_at)`, base catalog columns from migration 001, optional rich product fields from 021, and later offer/image additions. These are not substituted for the requested live audit. Apply the verification query and attach its results before approving migration 024.

## Security repair

Migration 024 keeps RLS enabled. Grants give `authenticated` the catalog operations used by admin workflows and revoke anonymous writes. Separate policies require `auth.uid()` to match `admin_users.user_id` with `role='admin'` and `is_active=true`. Offer DELETE is included because the existing atomic replacement RPC deletes removed offers. No service-role credential is used by the browser.
