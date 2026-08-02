# HypeBuzz Known Issues

**Audit date:** 2026-07-30. These are evidence-backed defects or material risks visible in the current repository. “Live unknown” means the repository cannot prove the deployed Supabase state.

## Critical

### HB-001 — Production database equivalence is not proven

- **Severity:** Critical
- **Root cause:** migrations were historically applied non-sequentially/manually; no current exported remote migration ledger or verification result exists.
- **Impact:** admin writes, publication triggers, product images, permanent deletion, grants, and public RLS can fail or behave differently from code.
- **Files:** `supabase/migrations/001_initial_schema.sql` through `028_restore_migration_027_prerequisites.sql`, `supabase/verification/verify_production_schema.sql`, `docs/DATABASE_AUDIT.md`.
- **Evidence:** migrations 022/027/028 are explicit reconciliation/restoration migrations; the 2026-07-26 database audit documented missing/out-of-order live objects.

### HB-002 — Affiliate redirects require an unverified/missing secret

- **Severity:** Critical for revenue workflow
- **Root cause:** `createAdminClient()` throws without `SUPABASE_SECRET_KEY`; local env does not define it and production config was not inspectable.
- **Impact:** `/go/[offerId]` catches the failure and always redirects to `/go/unavailable`, breaking monetized outbound clicks.
- **Files:** `lib/supabase/admin.ts`, `lib/affiliate/click-tracking.ts`, `app/go/[offerId]/route.ts`, `.env.local` (key-name audit only).

## High

### HB-003 — Search and category results are incomplete above 100 source products

- **Severity:** High
- **Root cause:** direct Supabase reads `.limit(100)` before application-side filtering/sorting, followed by a 48-item render slice.
- **Impact:** valid results can disappear; counts, filters, sorting, and catalog discoverability are wrong at production scale.
- **Files:** `lib/data/product-search.ts`, `lib/data/public-category.ts`, `app/search/page.tsx`, `app/categories/[slug]/page.tsx`.

### HB-004 — Product/image/offer storage workflow is not fully atomic

- **Severity:** High
- **Root cause:** PostgreSQL RPC transactions cannot include Storage uploads; follow-up rich-field/image/offer work and compensation span steps.
- **Impact:** a downstream failure can leave partial records or orphaned objects; cleanup can itself fail.
- **Files:** `app/admin/(protected)/products/actions.ts`, migrations 027/028, `components/admin/product-images-field.tsx`.

### HB-005 — No current end-to-end proof of the required product workflow

- **Severity:** High
- **Root cause:** tests are unit/component-focused and use no browser/live Supabase environment.
- **Impact:** login, cookies, RLS, RPCs, Storage, publish visibility, compare, and affiliate redirect may fail despite 52 passing tests.
- **Files:** `tests/*.test.ts`, `package.json`; no E2E configuration/workflow exists.

### HB-006 — Runtime errors lack application error boundaries

- **Severity:** High
- **Root cause:** no `app/error.tsx`, scoped `error.tsx`, or `global-error.tsx` exists.
- **Impact:** unexpected render/data errors lack a controlled recovery UI; several data modules instead disguise failures as empty content.
- **Files:** `app/`, `lib/data/homepage.ts`, `lib/data/product-search.ts`, `lib/data/public-category.ts`.

### HB-007 — Upload request size is risky for serverless deployment

- **Severity:** High
- **Root cause:** up to eight 5 MB files are sent through a Server Action with a 42 MB body limit.
- **Impact:** memory, timeout, proxy/platform request limit, slow-network, and retry failures can break saves.
- **Files:** `next.config.ts`, `components/admin/product-images-field.tsx`, `app/admin/(protected)/products/actions.ts`.

### HB-008 — Live RLS/grants/policies are unknown; verification expectations are partly stale

- **Severity:** High
- **Root cause:** current SQL verification has not been run/exported, and its expected product-image policy names predate migration 027 replacements.
- **Impact:** false alarms are possible while real privilege gaps remain undetected; public images/guides/admin writes may fail.
- **Files:** `supabase/verification/verify_production_schema.sql`, migrations 017/018/023/024/027.

## Medium

### HB-009 — Standalone TypeScript check fails in test source

- **Severity:** Medium
- **Root cause:** a test still passes removed prop `onBrandResolved` to `ProductJsonImporter`.
- **Impact:** `tsc --noEmit` fails, although `tsx` tests and Next production build pass because the build typecheck excludes test sources.
- **Files:** `tests/product-json-import.test.ts:166`, `components/admin/product-json-importer.tsx`.

### HB-010 — Affiliate analytics insert failures are silently ignored

- **Severity:** Medium
- **Root cause:** Supabase `.insert()` returns `{ error }` rather than throwing, but the result is not inspected; outer route errors are also swallowed.
- **Impact:** redirects may work while analytics are silently lost, with no alert or diagnostic.
- **Files:** `lib/affiliate/click-tracking.ts`, `app/go/[offerId]/route.ts`.

### HB-011 — Compare API over-exposes raw affiliate URLs and duplicates eligibility rules

- **Severity:** Medium
- **Root cause:** API selects/returns `affiliate_url`; client only validates it and does not render an outbound action. Eligibility is reimplemented in the client.
- **Impact:** unnecessary destination disclosure and contract drift from `lib/offers/publication-contract.ts`.
- **Files:** `app/api/compare/route.ts`, `components/compare/compare-page-client.tsx`.

### HB-012 — Compare feature is not fully integrated or verified

- **Severity:** Medium
- **Root cause:** current compare routes/components/tests are uncommitted work and tests cover only storage selection parsing.
- **Impact:** API/UI/network/error/accessibility behavior and compare-to-affiliate flow are unproven.
- **Files:** `app/compare`, `app/api/compare`, `components/compare`, `lib/compare`, `tests/compare-workflow.test.ts`.

### HB-013 — “Popular” sorting is not popularity sorting

- **Severity:** Medium
- **Root cause:** `popular` and `newest` both sort by `created_at` descending; there is no popularity signal.
- **Impact:** misleading user control and ranking.
- **Files:** `lib/data/product-search.ts`, `lib/validation/product-search.ts`, `components/search/search-filters.tsx`.

### HB-014 — Offer freshness is displayed but not enforced

- **Severity:** Medium
- **Root cause:** public visibility/redirect checks do not reject stale or null `last_checked_at` values.
- **Impact:** obsolete prices/availability can remain public and monetizable.
- **Files:** `lib/data/public-product.ts`, `lib/offers/publication-contract.ts`, `lib/affiliate/click-tracking.ts`.

### HB-015 — Arbitrary external product image hosts are accepted

- **Severity:** Medium
- **Root cause:** admin may save any HTTP(S) image URL and public UI renders raw `<img>` sources.
- **Impact:** privacy/referrer leakage, broken/changed content, mixed performance, and no controlled optimization/retention.
- **Files:** `components/admin/product-images-field.tsx`, `lib/validation/product.ts`, product/compare image components.

### HB-016 — Data failures can masquerade as valid empty states

- **Severity:** Medium
- **Root cause:** several loaders log then return empty arrays/counts; dashboard metrics can coerce unavailable data to zero.
- **Impact:** operators/users cannot distinguish outage, permission failure, and empty catalog.
- **Files:** `lib/data/homepage.ts`, `lib/data/admin-dashboard.ts`, `lib/data/product-search.ts`, `lib/data/public-category.ts`.

### HB-017 — Logging and monitoring are incomplete

- **Severity:** Medium
- **Root cause:** ad hoc console calls, no centralized structured logger/correlation/error service, and silent catches.
- **Impact:** poor incident detection and diagnosis; no reliable affiliate/admin audit trail.
- **Files:** `app/admin/(protected)/**/actions.ts`, `lib/data/*.ts`, `app/go/[offerId]/route.ts`.

### HB-018 — Authentication dependency errors are misclassified

- **Severity:** Medium
- **Root cause:** `getAdminAccess()` catches every exception and returns `denied`; other paths return generic login/verification messages.
- **Impact:** a Supabase outage can look like an authorization failure and provides no operational evidence.
- **Files:** `lib/auth/admin.ts`, `lib/auth/admin-identity.ts`, admin protected layout/actions.

### HB-019 — Image dialogs are not keyboard-complete

- **Severity:** Medium
- **Root cause:** custom modal/dialog UI lacks a demonstrated focus trap, Escape close, and focus restoration.
- **Impact:** keyboard and assistive-technology users may lose context or tab behind the dialog.
- **Files:** `components/admin/product-image-editor.tsx`, `components/admin/product-images-field.tsx`, `components/admin/product-actions.tsx`.

### HB-020 — Public structured offer data needs semantic verification

- **Severity:** Medium
- **Root cause:** Schema.org offer URLs point to the page fragment rather than the redirect/destination; unsupported availability falls back; multi-currency aggregates use one currency.
- **Impact:** inaccurate rich results or validator warnings.
- **Files:** `app/products/[slug]/page.tsx`, `lib/offers/publication-contract.ts`.

### HB-021 — Category page authority can produce indexable thin pages

- **Severity:** Medium
- **Root cause:** static category mapping and DB data are both involved; a registry-known slug can render without a corresponding active category/data record.
- **Impact:** 200/SEO pages that are empty or inconsistent with admin catalog state.
- **Files:** `lib/catalog/category-mapping.ts`, `lib/data/public-category.ts`, `app/categories/[slug]/page.tsx`.

### HB-022 — No CI enforcement

- **Severity:** Medium
- **Root cause:** no GitHub Actions/other CI workflow was found.
- **Impact:** lint/tests/build/type regressions are not automatically gated.
- **Files:** repository root, `package.json`; `.github/workflows` absent.

## Low

### HB-023 — Admin Import and Settings are placeholders

- **Severity:** Low (higher if promised at launch)
- **Root cause:** navigation routes intentionally render `AdminPlaceholderPage`.
- **Impact:** exposed admin destinations have no functionality.
- **Files:** `app/admin/(protected)/import/page.tsx`, `app/admin/(protected)/settings/page.tsx`, `components/admin/admin-placeholder-page.tsx`.

### HB-024 — Support forms are nonfunctional

- **Severity:** Low
- **Root cause:** company forms are presentation-only with disabled submission.
- **Impact:** users cannot contact/report/suggest through the site despite form-like UI.
- **Files:** `components/information/ui-only-form.tsx`, company contact/report/suggest routes.

### HB-025 — Sample market data is presented as a market feature

- **Severity:** Low
- **Root cause:** market bar consumes hard-coded sample data rather than a dated/live provider.
- **Impact:** stale or misleading information.
- **Files:** `lib/data/sample-market-data.ts`, `components/market/live-market-bar.tsx`.

### HB-026 — Stale project documentation

- **Severity:** Low
- **Root cause:** implementation advanced beyond initial setup documentation.
- **Impact:** operators may stop migrations at 016 or believe CRUD is absent.
- **Files:** `supabase/README.md`, root `README.md`, older audit/progress docs.

### HB-027 — Unused/underused schema and APIs add maintenance cost

- **Severity:** Low
- **Root cause:** planned RPC/fields/features were superseded or not completed.
- **Impact:** ambiguity and drift around `search_products`, `search_category_products`, `amazon_asin`, `affiliate_tracking_parameter`, and public blog usage.
- **Files:** migrations 001/010/011/013/014, `lib/types/database.ts`, `lib/data/product-search.ts`, `lib/data/public-category.ts`.
