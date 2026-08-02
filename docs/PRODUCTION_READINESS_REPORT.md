# HypeBuzz Production Readiness Verification

**Verification date:** 2026-07-30  
**Classification:** **Needs Major Fixes**  
**Scope:** repository working tree, configured Supabase production project, and canonical deployment URL. No production mutation or migration was performed.

## Executive conclusion

The repository builds and its automated contracts pass, but the deployed system is not production-ready. The configured production database is selectively migrated, the current application depends on an RPC that is absent in production, published product image Storage reads fail with HTTP 403, and the canonical URL `https://hypebuzz.in` returns HTTP 403 and appears unrelated to this storefront in public search results. Owner-only database verification and authenticated end-to-end testing could not be completed because this workspace has only a publishable Supabase key and no browser/admin session, database-owner credential, Supabase secret key, Vercel project metadata, or confirmed deployment URL.

## Evidence collected

- `npm test`: **62/62 tests passed**.
- `tsc --noEmit`: **passed**.
- ESLint: **passed**.
- `next build`: **passed**; TypeScript completed and 70 static pages were generated.
- Read-only production PostgREST probes used the configured publishable key.
- Unauthorized RPC probes used invalid/nonexistent IDs and confirmed function existence by a safe `42501` response; no write was possible.
- Public Storage download was attempted for one published product-image row and returned `403 permission denied for table admin_users`.
- Canonical public deployment fetch returned HTTP 403.

## 1. Database verification

### Migration 020-030 status

| Migration | Production status | Evidence |
|---|---|---|
| 020 publication contract | **Missing / inconsistent** | Exact `assert_product_is_storefront_ready(uuid)` probe returned `PGRST202` function not found. |
| 021 rich product fields | **Present** | `products.highlights`, `seo_title`, and `seo_description` select succeeded against a published row. |
| 022 restore save RPC | **Present** | Exact 17-argument `save_product_with_offer` call was resolved and rejected anonymous execution with `42501`. |
| 023 offer access reconciliation | **Owner verification required** | Offer columns and replacement RPC exist, but table grants and authenticated admin policies cannot be enumerated with the publishable key. |
| 024 catalog admin security | **Owner verification required** | Effective grants/policy definitions require SQL-owner catalog access. |
| 025/026 permanent delete | **Function present; final definition unverified** | `permanently_delete_archived_product(uuid)` resolves and rejects anon with `42501`; `pg_get_functiondef` is required to prove migration 026 is the active body. |
| 027 required product images | **Partially present, operationally broken** | Table/columns and image/create RPCs exist. Product image rows are publicly selectable, but private object delivery returns 403 through an `admin_users` policy dependency. Trigger/index/policy definitions require owner verification. |
| 028 prerequisite restoration | **Present at object level** | Rich product columns, offer editorial columns, `replace_product_offers`, and atomic create RPC are present. Exact constraints/function definition require owner verification. |
| 029 atomic product workflow | **Missing** | `save_product_workflow(uuid,jsonb,jsonb,jsonb)` returned `PGRST202`. Current create/edit actions require it, so deploying current code before this migration breaks product writes. |
| 030 public asset policy repair | **Repository only / pending** | Added during this verification in response to the demonstrated image 403. It has not been applied remotely. |

### Additional confirmed drift

- `categories.display_order` is missing (`42703`), so migration 008 is absent.
- `brands.description` and `brands.website_url` are missing (`42703`), so migration 009 is absent.
- `blog_posts` is absent from the schema cache (`PGRST205`), so migration 014 is absent or unexposed.
- Public `knowledge_hub_items` reads return `42501 permission denied for table admin_users`; its public/admin policy design remains broken in production.
- Product and offer data exist, including published products and product images. This is not an empty/new project.

### Objects not fully verifiable with current access

The publishable key cannot safely enumerate the production migration ledger, constraints, indexes, foreign keys, triggers, views, RLS flags, complete policy definitions, grants, private buckets, or storage policies. The updated `supabase/verification/verify_production_schema.sql` now checks all of these, plus migrations 020-030, current policy names, views, and database orphan counts. It must be run as a database owner and its result sets retained before release.

## 2. Storage verification

### Confirmed

- A published `product_images` row exists with a valid `/product-images/{uuid}` URL shape and non-empty Storage path.
- The `product-images` table and expected migration-027 columns are present.
- The bucket is private from the application design; delivery is mediated by the server route and Storage RLS.

### Production failure

Downloading the referenced object with the configured anonymous/publishable identity returned:

```text
403 Unauthorized: permission denied for table admin_users
```

This means an unauthenticated product page cannot reliably load its stored product image through the same policy path used by `app/product-images/[id]/route.ts`.

### Fix prepared

Migration 030 introduces narrow `SECURITY DEFINER` Boolean checks for published product/knowledge assets and recreates public Storage policies so anonymous evaluation does not require `admin_users`. The functions expose no rows or private metadata, set an empty search path, and grant only execute access. Admin upload/update/delete policies remain unchanged.

### Still required

- Apply 030 in staging, then production.
- Verify JPEG/PNG/WebP upload, public route delivery, replacement, deletion, and archived/permanently deleted product cleanup.
- Run the owner-only orphan SQL and inspect Storage objects not referenced by `product_images`; database SQL alone cannot enumerate object-to-row mismatches beyond Storage catalog access.

## 3. Affiliate system

### Repository behavior

- Offer IDs are UUID-validated.
- Only active offers belonging to published products and active merchants can redirect.
- Destinations are restricted to HTTP/HTTPS.
- Invalid/missing offers safely redirect to `/go/unavailable`.
- Click tracking failure does not prevent a validated redirect.

### Stability fixes

- Database lookup failures are now logged with structured context.
- Supabase insert return errors are checked and logged; previously they were silently ignored because Supabase returns errors rather than throwing.
- Thrown tracking and route-resolution failures are logged while preserving the safe public fallback.

### Production blockers

- Local configuration has no `SUPABASE_SECRET_KEY`; production environment configuration is inaccessible and therefore unverified.
- The canonical deployment is inaccessible, so `/go/[offerId]` could not be exercised end to end.
- A real redirect/click row must be verified after the correct deployment URL and server secret are confirmed.

## 4. Security observations

### Positive controls

- Admin routes refresh sessions through the Next.js proxy and protected layouts verify active `admin_users` membership.
- Product/offer/category/brand/merchant Server Actions recheck authentication/authorization rather than trusting page protection.
- Server Actions validate UUIDs, URLs, prices, statuses, image manifests/types/sizes, rich JSON, and publication requirements.
- Product workflow RPCs are revoked from anon and demonstrated to reject anonymous invocation.
- Affiliate secret access is confined to a `server-only` Supabase admin module.
- Public product-image delivery queries rows through RLS rather than accepting arbitrary Storage paths.

### Risks/blockers

- Effective production RLS/grants cannot be approved until the owner SQL is run.
- Production has policy expressions that indirectly require anonymous access to `admin_users`, breaking public reads.
- The exact deployed commit/URL is unknown; domain 403 prevents HTTP security-header and route testing.
- No authenticated non-admin/admin/inactive-admin matrix was executed against production or staging.
- Compare API returns raw affiliate URLs although the client does not need to navigate to them; this is an existing exposure to address separately, not changed in this stability sprint.

## 5. Error handling and resilience

### Fixed

- Added route-level `app/error.tsx` with retry/home recovery.
- Added `app/global-error.tsx` for root-layout failures.
- Both log safe error digest/name/message context.
- Affiliate lookup, tracking-return errors, thrown errors, and redirect-resolution errors are no longer silent.

### Remaining operational gap

Console logging is available to Vercel/runtime logs but no external error-monitoring destination, alert, retention policy, or correlation standard is configured. Production launch should at minimum confirm log capture and alert ownership for product-save, Storage, authentication, and affiliate failures.

## 6. Deployment review

### Build compatibility

- Next.js 16.2.10 production build passes with the bundled current API conventions.
- App Router routes, proxy, Server Actions, and dynamic/static generation compile successfully.
- The 42 MB Server Action body limit remains a hosting-limit risk for eight 5 MB images; maximum-size staging upload must be tested on the target Vercel plan.

### Environment inventory

| Variable | Local evidence | Production requirement |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Present | Must identify the verified production project |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Present | Must match that project in Development/Preview/Production |
| `SUPABASE_SECRET_KEY` | Absent | Required server-only for affiliate redirect/click tracking |
| `NEXT_PUBLIC_SITE_URL` | Absent | Must be set to the confirmed storefront deployment; current fallback `hypebuzz.in` returns 403 and appears unrelated |
| `GOOGLE_SITE_VERIFICATION` | Present | Non-blocking for runtime stability |

No `.vercel/project.json`, `.openai/hosting.json`, deployment manifest, or confirmed Vercel hostname exists in the repository.

## 7. Critical workflow results

| Workflow | Status | Evidence |
|---|---|---|
| Login | **Not live-tested** | Code/auth checks build; no browser backend/admin session. |
| Product creation | **Blocked in current production** | Current action requires missing migration-029 RPC. |
| Product editing | **Blocked in current production** | Same missing RPC. |
| Product publishing | **Blocked/unverified** | Migration-020 assertion missing and current write RPC missing. |
| Product page | **Data exists; image path broken** | Published product/image rows are readable; Storage download is 403; deployment URL unavailable. |
| Compare page | **Automated contract only** | Selection tests pass; deployment unavailable. |
| Affiliate redirect | **Code-safe, production unverified** | Secret/deployment inaccessible; invalid-path fallback and URL validation tested. |
| Image upload | **Schema present, live admin test blocked** | Upload policies/bucket require authenticated staging test; public read currently broken. |
| Product deletion | **RPC exists, live test not run** | Anon rejection verified; authenticated delete/cleanup requires controlled staging fixture. |

## Production issues fixed in the repository

1. Silent affiliate lookup/tracking/redirect failures now produce actionable server logs.
2. Route-level and global error boundaries provide user recovery.
3. Production verification SQL now covers migrations 020-030, atomic workflow functions, current image policies, image-publication trigger, views, ledger entries, and database orphans.
4. Migration 030 repairs the demonstrated anonymous product-image/knowledge-asset policy failure without weakening admin writes.
5. Five production-stability regression tests were added and included in the full suite.

## Remaining launch blockers, ranked

1. **Confirm the real storefront deployment URL.** `hypebuzz.in` returns 403 and public evidence identifies another business; set `NEXT_PUBLIC_SITE_URL` and Vercel domains to the owned storefront.
2. **Reconcile the production database in staging first.** At minimum migrations 008, 009, 014, 020, 029, and 030 are missing/inconsistent. Do not blindly replay history against live data.
3. **Apply 029 before current application code.** Without it, product creation/editing fail immediately.
4. **Apply and verify 030.** Published stored images currently return 403.
5. **Run the owner verification SQL.** Resolve every non-OK ledger/table/column/function/index/trigger/policy/RLS/bucket/constraint/grant/orphan result.
6. **Configure `SUPABASE_SECRET_KEY` in Vercel server environments.** Verify it is absent from client bundles/logs.
7. **Run authenticated staging E2E.** Login, create/import/upload/draft/publish/edit/page/compare/redirect/delete, including non-admin/RLS and failure paths.
8. **Verify maximum image payload on the target Vercel plan and confirm runtime logs/alerts.**

## Deployment checklist

- [ ] Identify the exact commit and Vercel project being released.
- [ ] Confirm owned Production/Preview domains; set `NEXT_PUBLIC_SITE_URL`.
- [ ] Back up Supabase / confirm PITR before reconciliation.
- [ ] Run and export the owner verification SQL before changes.
- [ ] Build a forward-only reconciliation plan from actual results.
- [ ] Apply migrations 029 and 030 to staging after prerequisites; rerun verification.
- [ ] Apply all other proven missing schema objects without destructive historical replay.
- [ ] Test anon, non-admin, active admin, and inactive admin permissions.
- [ ] Verify private bucket limits/MIME types and public published-object delivery.
- [ ] Set/verify Supabase URL, publishable key, and server-only secret in every Vercel environment.
- [ ] Execute every critical workflow using disposable staging fixtures.
- [ ] Confirm product and Storage orphan counts are zero after create/update/delete failure injection.
- [ ] Run `npm test`, `tsc --noEmit`, ESLint, and `next build` in CI.
- [ ] Deploy preview, smoke-test, then production with rollback owner/on-call identified.

## Launch readiness assessment

**Needs Major Fixes.** Repository quality gates pass and the stability fixes are prepared, but production currently fails three fundamental requirements: reachable storefront deployment, schema compatibility with the application, and public product-image delivery. “Ready for Beta” is appropriate only after the database is reconciled, migrations 029/030 are deployed, the correct URL and secret are configured, owner verification is clean, and the authenticated staging workflow passes. “Ready for Production” additionally requires the complete security role matrix, Storage cleanup verification, target-host upload limits, and operational monitoring/rollback gates.
