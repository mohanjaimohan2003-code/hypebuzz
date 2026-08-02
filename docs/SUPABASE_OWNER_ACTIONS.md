# Supabase Owner Actions

Use the Supabase Dashboard SQL Editor for the **confirmed production project only**. Do not replay migrations 001–030. Take a database backup before applying changes. Do not expose keys or SQL result exports publicly.

## Step 1 — Confirm the target

Open Project Settings and record the project name/ref privately. Confirm its Project URL matches the hostname configured as `NEXT_PUBLIC_SUPABASE_URL` in the Vercel Production environment. Stop if they differ.

## Step 2 — Run the read-only pre-launch verification

Open [pre_launch_verification.sql](../supabase/verification/pre_launch_verification.sql), copy the complete file into a new SQL Editor query, and run it. Export or save every result set before changing the schema.

Expected before applying anything:

- Required tables, columns, indexes, RLS, and buckets report `OK`.
- The three orphan counts are `0`.
- Review policies and grants for unexpected anonymous/authenticated writes.
- `save_product_workflow`, `can_read_published_product_image_object`, and `can_read_published_knowledge_asset` may be `MISSING`; that establishes whether 029/030 are required.
- A migration-ledger row is supporting evidence only. Manual SQL Editor execution may not create a ledger entry; object verification is authoritative.

Stop and send the exported results for code/database repair if any pre-029/030 table, required column, foreign key, publication trigger, product image bucket, or Knowledge Hub bucket is missing or mismatched.

## Step 3 — Apply migration 029 only if required

If `save_product_workflow(uuid, jsonb, jsonb, jsonb)` is missing or does not match, open [029_atomic_product_workflow.sql](../supabase/migrations/029_atomic_product_workflow.sql), copy the complete file into a new SQL Editor query, and run it once.

Expected result: successful transaction with no product rows deleted. The function exists as `SECURITY DEFINER`; `anon`/`PUBLIC` cannot execute it; `authenticated` can execute it; the function itself rejects anyone who is not an active admin.

## Step 4 — Apply migration 030 only if required

If either asset-read helper is missing, or the current public image request still produces `permission denied for table admin_users`, open [030_fix_public_asset_read_policies.sql](../supabase/migrations/030_fix_public_asset_read_policies.sql), copy the complete file into a new SQL Editor query, and run it once.

Expected result:

- `product-images`, `knowledge-hub-pdfs`, and `knowledge-hub-thumbnails` remain private buckets.
- Anonymous/authenticated users can execute only the two read predicates.
- The public Storage SELECT policies use those predicates and do not query `admin_users` in the caller's security context.
- Admin upload/update/delete policies remain present; no anonymous INSERT, UPDATE, or DELETE policy is added.
- Only objects linked to published products or published Knowledge Hub records are readable.

## Step 5 — Run post-migration verification

Run [verify_production_schema.sql](../supabase/verification/verify_production_schema.sql), then run [pre_launch_verification.sql](../supabase/verification/pre_launch_verification.sql) again. Save both outputs.

Expected result: no `MISSING`, `MISMATCH`, `SIGNATURE_MISMATCH`, `SECURITY_MODE_MISMATCH`, `RLS_DISABLED`, or disabled publication trigger; all orphan counts are `0`. Review result sets for policies and grants manually—an `OK` name alone does not prove a safe definition.

## Step 6 — Prove image delivery

Choose a disposable published product with an uploaded image and record its product ID, product slug, `product_images.storage_path`, and public image route. In a signed-out/private browser window:

1. Open `/products/[slug]`.
2. Open the rendered `/product-images/[id]` URL directly.
3. Confirm HTTP `200`, correct image content, and no `admin_users` permission error.
4. Confirm a draft product's uploaded object cannot be fetched anonymously.

## Step 7 — Run authenticated product acceptance

For three different disposable products, complete Login → Add Product → Paste JSON → Auto Fill → resolve category/brand → select merchant → upload image → save draft → edit → publish → public page → compare → affiliate redirect. Use unique slugs. Retry one submission and confirm only one `products` row exists and its expected `product_images` and `product_offers` rows exist.

Archive/delete the disposable products through the application afterward and confirm replacement/deletion cleanup behaves as intended. Do not delete records directly while testing transaction behavior.
