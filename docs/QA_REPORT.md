# HypeBuzz QA Audit Report

Audit date: 2026-07-26  
Audited deployment: `https://hypebuzz.vercel.app`  
Audited repository: current workspace, including migrations `001` through `019`

## Executive summary

HypeBuzz is not launch-ready. The audit found 4 Critical, 11 High, 10 Medium, and 6 Low issues. The main launch blockers are an inconsistent product-publication contract, non-atomic product editing, schema/migration drift between application and production, incomplete search behavior, broken primary-navigation destinations, and production SEO metadata pointing to a different domain.

Public routes were checked with read-only HTTP requests. The homepage, search, Mobiles, Laptops, robots, sitemap, and manifest routes returned HTTP 200. Unauthenticated `/admin` and `/admin/categories` correctly redirected to `/admin/login`. An interactive browser and authenticated admin session were unavailable, so admin form submission, visual breakpoint testing, keyboard/screen-reader testing, and real storage uploads remain explicitly unverified.

No application code was changed during this audit. Only this report and `docs/LAUNCH_CHECKLIST.md` were created.

## Launch blockers

- QA-001: product publication rules disagree across UI, action, and SQL.
- QA-002: product updates can partially persist after a reported failure.
- QA-003: production schema is behind assumptions made by checked-in application/migrations.
- QA-004: there is no automated regression test suite.
- QA-005: search silently excludes products beyond the first 100 rows.
- QA-006: the primary Trending control does not filter trending products.
- QA-007: `/wishlist` and `/login` are linked globally but do not exist.
- QA-008: production canonical/robots/sitemap URLs use a different host.
- QA-009: public navigation advertises categories that are not active database categories.
- QA-010: product image/storage cleanup is not transactionally safe.

## Defects

### QA-001 — Product publication rules contradict each other

- Severity: Critical
- Module: Products CRUD / Product offers / Validation / Supabase
- Root cause: Product validation accepts a published product with an active `pre_order` offer and permits `originalPrice` to be null. `save_product_with_offer` from migration 016 rejects `pre_order`, requires `original_price`, and accepts a different availability set. Migration 019 updates the readiness assertion but does not replace the save RPC. A form that passes application validation can therefore fail at the database.
- Recommended fix: Define one publication contract and implement it identically in validation, the save RPC, readiness triggers, standalone offer actions, and public eligibility helpers. Add contract tests for every availability and nullable-price combination.
- Files involved: `lib/validation/product.ts`, `lib/validation/offer.ts`, `app/admin/(protected)/products/actions.ts`, `supabase/migrations/016_atomic_product_publication.sql`, `supabase/migrations/019_price_comparison_mvp.sql`, `lib/offers/price-comparison.ts`

### QA-002 — Product edits are not atomic

- Severity: Critical
- Module: Products CRUD / Product offers / Image uploads
- Root cause: `updateProduct` saves the core product and one offer first, then saves the brand, replaces images, and finally replaces all offers. A later image or offer failure returns an error after earlier changes have committed. The administrator is told the save failed even though production data may already be partly changed.
- Recommended fix: Move all relational database changes into one transaction/RPC. Stage storage uploads first, commit database references atomically, and compensate uploaded objects if the database transaction fails. Do not mutate the existing record until validation and staging succeed.
- Files involved: `app/admin/(protected)/products/actions.ts`, `supabase/migrations/016_atomic_product_publication.sql`, `supabase/migrations/018_product_images.sql`, `supabase/migrations/019_price_comparison_mvp.sql`

### QA-003 — Deployed schema and application migration assumptions are inconsistent

- Severity: Critical
- Module: Supabase integration / RLS assumptions / Categories CRUD
- Root cause: A live read-only query previously confirmed production lacks `categories.display_order` although migration 008 adds it. Other features rely on later tables, columns, storage policies, and RPCs through migration 019. The repository has no enforced migration gate, so a successful Vercel deployment can target an incompatible database.
- Recommended fix: Establish a migration ledger in deployment, compare production migration history with the repository before release, and fail deployment when required schema objects are absent. Maintain a staging Supabase project upgraded by the same pipeline.
- Files involved: `supabase/migrations/008_add_category_display_order.sql`, `supabase/migrations/016_atomic_product_publication.sql`, `supabase/migrations/017_knowledge_hub_pdfs.sql`, `supabase/migrations/018_product_images.sql`, `supabase/migrations/019_price_comparison_mvp.sql`, `lib/types/database.ts`

### QA-004 — No automated tests protect launch-critical workflows

- Severity: Critical
- Module: Validation / Authentication / CRUD / Search / Affiliate links
- Root cause: `package.json` contains lint and build scripts only. There are no unit, integration, database-contract, accessibility, or end-to-end tests. Contract regressions such as QA-001 and the category schema failure can reach production undetected.
- Recommended fix: Add unit tests for validators and price logic, Supabase/RLS integration tests against staging, and Playwright end-to-end coverage for public discovery, admin CRUD, uploads, and affiliate redirects. Make them required CI checks.
- Files involved: `package.json`, `lib/validation/*`, `lib/data/*`, `app/admin/(protected)/*`, `supabase/migrations/*`

### QA-005 — Search filters only the first 100 newest products

- Severity: High
- Module: Search / Products / Performance
- Root cause: Search fetches up to 100 newest published products and performs query, category, brand, merchant, price, discount, availability, and sorting in JavaScript. Matching products outside that initial window are invisible. Results are then sliced to 48 with no pagination.
- Recommended fix: Move filtering, sorting, counting, and pagination into a SQL function or indexed database query. Return a stable cursor/page and total count.
- Files involved: `lib/data/product-search.ts`, `app/search/page.tsx`, `components/search/search-filters.tsx`, `supabase/migrations/011_public_product_search.sql`

### QA-006 — Trending navigation does not request trending products

- Severity: High
- Module: Navigation / Search / Homepage
- Root cause: The navigation links to `/search?trending=true`, but `parseProductSearchParams` has no `trending` field and `searchProducts` never filters `is_trending`. The deployed page renders the ordinary “Search products” view.
- Recommended fix: Link to the implemented `/trending` page or add a validated trending filter to the search contract and database query. Add a route test asserting only trending products appear.
- Files involved: `components/layout/category-navigation.tsx`, `lib/validation/product-search.ts`, `lib/data/product-search.ts`, `app/trending/page.tsx`

### QA-007 — Global Wishlist and Login links lead to missing routes

- Severity: High
- Module: Navigation / Authentication / Products
- Root cause: The navbar globally links to `/wishlist` and `/login`, but neither route exists. The wishlist button only changes component state and is lost on reload.
- Recommended fix: Before launch, either implement the intended customer authentication/wishlist flows or remove/hide the links and non-persistent controls. Do not expose navigation to 404 pages.
- Files involved: `components/layout/navbar.tsx`, `components/product/product-card-actions.tsx`, `app/`

### QA-008 — Production SEO URLs point to another domain

- Severity: High
- Module: SEO / Environment validation
- Root cause: Deployed `robots.txt` reports `Host: https://hypebuzzshop.in` and a sitemap on that host while the audited production URL is `hypebuzz.vercel.app`. All canonicals, Open Graph URLs, JSON-LD URLs, and sitemap entries derive from `NEXT_PUBLIC_SITE_URL`, so the same mismatch can consolidate indexing away from the live deployment.
- Recommended fix: Decide the canonical launch domain, configure `NEXT_PUBLIC_SITE_URL` to exactly that origin in Vercel, redirect all alternate hosts to it, and verify robots, sitemap, canonicals, Open Graph, and JSON-LD after deployment.
- Files involved: `lib/seo/site.ts`, `app/layout.tsx`, `app/robots.ts`, `app/sitemap.ts`, Vercel environment configuration

### QA-009 — Public category navigation is hard-coded rather than database-driven

- Severity: High
- Module: Categories / Navigation / Supabase
- Root cause: `getPublicNavigationCategories` always returns 15 static definitions. Production currently contains Mobiles, yet navigation advertises Laptops and other registry categories. `/categories/laptops` returns HTTP 200 with an empty page instead of representing the active database catalog.
- Recommended fix: Load active categories from Supabase, order them predictably, and use the static registry only as optional copy fallback for a matching database row. Unknown/inactive category slugs should return 404 or an intentional non-indexable state.
- Files involved: `lib/data/public-category.ts`, `lib/data/public-categories.ts`, `components/layout/category-navigation.tsx`, `app/categories/[slug]/page.tsx`

### QA-010 — Failed product creation can orphan uploaded storage objects

- Severity: High
- Module: Image uploads / Products CRUD / Supabase Storage
- Root cause: Images can be uploaded and committed before offer synchronization. If the offer step fails, `delete_failed_product` deletes the product/database rows but does not remove storage objects. Similar compensation gaps exist when cleanup calls fail, and cleanup errors are ignored.
- Recommended fix: Track every newly uploaded path and always compensate it on downstream failure. Log cleanup failures for retry, and add an orphan-reconciliation job/report.
- Files involved: `app/admin/(protected)/products/actions.ts`, `supabase/migrations/018_product_images.sql`

### QA-011 — “Popular” sort is actually newest-first

- Severity: High
- Module: Search / Navigation
- Root cause: Both `popular` and `newest` sort by `created_at` descending. No popularity signal is read. Footer “Trending Deals” also uses `sort=popular`, so its label is misleading.
- Recommended fix: Define a popularity metric, such as qualified clicks in a recent window, and sort using that database-backed metric. Until available, remove the Popular option and misleading link.
- Files involved: `lib/data/product-search.ts`, `lib/validation/product-search.ts`, `components/search/search-filters.tsx`, `components/layout/footer.tsx`

### QA-012 — Sample financial data is presented in a live-market component

- Severity: High
- Module: Homepage / Accuracy / Navigation
- Root cause: `LiveMarketBar` renders hard-coded sample gold, index, crypto, and currency values. Although one ARIA label says “sample,” the visible component and naming imply current market data and rotate automatically.
- Recommended fix: Remove the bar for launch or label every visible value clearly as static demonstration data with an “as of” date. Do not present stale financial values as live.
- Files involved: `components/market/live-market-bar.tsx`, `components/market/rotating-currency-card.tsx`, `lib/data/sample-market-data.ts`

### QA-013 — Public offer freshness is not enforced

- Severity: High
- Module: Product offers / Affiliate links / Accuracy
- Root cause: Active offers remain public regardless of `last_checked_at`; it may be null or stale. Admin marks offers stale after seven days, but public product/search/homepage queries do not exclude or visibly qualify them.
- Recommended fix: Establish a freshness SLA. Exclude expired offers or prominently show their verification timestamp and require revalidation before they remain purchasable.
- Files involved: `lib/data/public-product.ts`, `lib/data/product-search.ts`, `lib/data/homepage.ts`, `lib/data/public-category.ts`, `lib/data/admin-offers.ts`

### QA-014 — Admin list and CRUD errors are inconsistently logged and over-generalized

- Severity: High
- Module: Error handling / Categories / Brands / Merchants / Dashboard
- Root cause: Categories now have structured diagnostics, but brands, merchants, dashboard, blog, and several taxonomy paths collapse database/RLS/schema errors into empty arrays or generic messages without structured code, details, hint, or HTTP status. The admin dashboard shows failed counts as genuine zeroes.
- Recommended fix: Introduce one server-only Supabase diagnostic helper, assign safe incident references, distinguish empty data from failed data, and expose retryable safe messages in the UI.
- Files involved: `lib/data/admin-brands.ts`, `lib/data/admin-merchants.ts`, `lib/data/admin-dashboard.ts`, `lib/data/admin-blog.ts`, `app/admin/(protected)/brands/actions.ts`, `app/admin/(protected)/merchants/actions.ts`

### QA-015 — Authentication infrastructure failures are reported as authorization denial

- Severity: High
- Module: Authentication / Authorization / Error handling
- Root cause: `getAdminAccess` catches every exception—including invalid environment configuration and Supabase/network errors—and returns `denied`. Legitimate administrators can be sent to Access Denied during an outage, hiding the operational cause.
- Recommended fix: Model authentication states separately: unauthenticated, unauthorized, and unavailable. Log the safe diagnostic server-side and show a retryable service error for unavailable identity/database dependencies.
- Files involved: `lib/auth/admin.ts`, `lib/supabase/env.ts`, `lib/supabase/server.ts`, `lib/supabase/proxy.ts`, `app/admin/(protected)/layout.tsx`

### QA-016 — Customer-facing support and correction forms do not submit

- Severity: Medium
- Module: Error reporting / Contact / Launch operations
- Root cause: Contact, report-information, and suggest-product forms are deliberately disabled UI-only forms. Users cannot submit broken affiliate links or inaccurate price/product data through the site.
- Recommended fix: Either implement secure form delivery with validation, spam controls, retention policy, and acknowledgement, or remove the nonfunctional controls and present a clear mail link as the only action.
- Files involved: `components/information/ui-only-form.tsx`, `app/(company)/contact/page.tsx`, `app/(company)/report-information/page.tsx`, `app/(company)/suggest-product/page.tsx`

### QA-017 — Brands and merchants lack dedicated public discovery destinations

- Severity: Medium
- Module: Brands / Merchants / Navigation / SEO
- Root cause: Footer links for Brands, Merchants, and Price Comparison all lead to unfiltered `/search`. Brand badges link to search filters, but there is no brand or merchant landing/index route despite admin-managed slugs and attempted brand-path revalidation.
- Recommended fix: Confirm intended launch scope. If public brand/merchant pages are required, implement index/detail routes and metadata; otherwise relabel footer links to accurately describe the search destination and remove dead revalidation paths.
- Files involved: `components/layout/footer.tsx`, `app/admin/(protected)/brands/actions.ts`, `lib/data/product-search.ts`, `app/`

### QA-018 — Search and category pages have no real pagination

- Severity: Medium
- Module: Search / Categories / Performance
- Root cause: Both paths fetch at most 100 products and render at most 48. Counts represent only the fetched subset, and users have no next page or indication that results were truncated.
- Recommended fix: Add server-side cursor pagination with stable sorting and accurate totals. Preserve filters in page links.
- Files involved: `lib/data/product-search.ts`, `lib/data/public-category.ts`, `app/search/page.tsx`, `app/categories/[slug]/page.tsx`

### QA-019 — External image URLs bypass optimization and permit arbitrary tracking hosts

- Severity: Medium
- Module: Image uploads / Performance / Privacy
- Root cause: Administrator-provided external images render through raw `<img>` elements from arbitrary HTTP(S) hosts. This avoids Next image optimization, exposes visitor IP/referrer information to third parties, and allows slow or unstable images.
- Recommended fix: Ingest approved external images into controlled storage, validate dimensions/content, or enforce a documented host allowlist and referrer policy. Prefer optimized locally controlled assets.
- Files involved: `components/product/product-card.tsx`, `components/product/product-gallery.tsx`, `components/admin/product-images-field.tsx`, `lib/validation/product.ts`

### QA-020 — Affiliate click failures have insufficient observability

- Severity: Medium
- Module: Affiliate links / Analytics / Error handling
- Root cause: The redirect route catches all resolution/configuration errors without logging. Analytics insert failures are also swallowed. A missing `SUPABASE_SECRET_KEY`, schema failure, or analytics outage becomes indistinguishable from an invalid offer.
- Recommended fix: Preserve the safe public fallback but emit structured server logs and monitoring metrics for resolution, eligibility, redirect, and analytics-write failures. Never log destination secrets, cookies, or keys.
- Files involved: `app/go/[offerId]/route.ts`, `lib/affiliate/click-tracking.ts`, `lib/supabase/admin.ts`

### QA-021 — Product structured data misrepresents some offer states

- Severity: Medium
- Module: SEO / Product offers
- Root cause: JSON-LD offer URLs point to the page fragment rather than the tracked offer route, and all states not recognized by `offerIsInStock` become `OutOfStock`; that includes pre-order. Aggregate currency is taken from one product-level value even though mixed-currency offers are not prohibited.
- Recommended fix: Map each availability to the correct Schema.org value, use a valid offer-specific destination, and either prohibit mixed currencies per product or group structured offers correctly.
- Files involved: `app/products/[slug]/page.tsx`, `lib/data/public-product.ts`, `lib/validation/product.ts`

### QA-022 — Custom image-edit dialog lacks complete modal keyboard behavior

- Severity: Medium
- Module: Accessibility / Image uploads
- Root cause: The URL-edit overlay uses `role="dialog"` and `aria-modal` on a `div` but does not trap focus, restore focus, or close with Escape. The crop editor requires the same manual verification.
- Recommended fix: Use native `<dialog>` or a tested accessible dialog primitive. Add focus trapping, initial focus, Escape handling, focus restoration, and keyboard-only tests.
- Files involved: `components/admin/product-images-field.tsx`, `components/admin/product-image-editor.tsx`

### QA-023 — Admin import and settings are exposed placeholders

- Severity: Medium
- Module: Admin dashboard / Navigation
- Root cause: Dashboard/navigation expose CSV Import and Settings as operational destinations, but both pages are placeholders. The dashboard calls Import a quick action.
- Recommended fix: Remove or clearly badge unavailable modules for launch, or implement and test them if included in launch scope.
- Files involved: `app/admin/(protected)/import/page.tsx`, `app/admin/(protected)/settings/page.tsx`, `app/admin/(protected)/page.tsx`, `components/admin/admin-navigation.tsx`

### QA-024 — Admin quick actions do not consistently open creation flows

- Severity: Medium
- Module: Admin dashboard
- Root cause: “Add Category,” “Add Brand,” and “Add Merchant” link to their list pages, unlike “Add Product,” which links directly to `/new`. This contradicts the action labels and adds unnecessary steps.
- Recommended fix: Point add actions to the corresponding `/new` routes or rename them to “Manage …”.
- Files involved: `app/admin/(protected)/page.tsx`

### QA-025 — Offer note validation contains contradictory limits

- Severity: Low
- Module: Validation / Product offers
- Root cause: Standalone offer validation first checks notes against 500 characters, then immediately overwrites the same error when over 100 characters. The database column is named `coupon_note`, while UI/code alternate among notes, coupon code, and coupon note.
- Recommended fix: Standardize terminology and enforce one 100-character coupon-code limit across standalone and embedded offer forms and SQL constraints.
- Files involved: `lib/validation/offer.ts`, `lib/validation/product.ts`, `app/admin/(protected)/offers/actions.ts`, `supabase/migrations/019_price_comparison_mvp.sql`

### QA-026 — Dashboard failure notice uses status semantics

- Severity: Low
- Module: Accessibility / Error handling / Admin dashboard
- Root cause: A dashboard data failure is rendered with `role="status"`, which is less urgent than an error alert, and failed metrics are displayed as zero without per-card unavailable states.
- Recommended fix: Use an appropriate alert announcement and render unavailable metrics as “Unavailable,” not `0`.
- Files involved: `app/admin/(protected)/page.tsx`, `lib/data/admin-dashboard.ts`

### QA-027 — Category “unknown” behavior creates thin indexable pages

- Severity: Low
- Module: Categories / SEO
- Root cause: Static registry categories can return valid 200 pages without a matching database category or products. Metadata treats registry definitions as real categories rather than missing catalog records.
- Recommended fix: Require an active database row for indexable category pages; otherwise return 404 or `noindex` with an explicit planned-category status.
- Files involved: `lib/data/public-category.ts`, `lib/data/public-categories.ts`, `app/categories/[slug]/page.tsx`

### QA-028 — Homepage catalog failures are mostly represented as empty content

- Severity: Low
- Module: Homepage / Error handling
- Root cause: Individual Supabase failures become empty sections and a combined `hasError`, but the homepage catalog primarily uses empty-state messaging. Shoppers cannot distinguish “no featured products” from a temporary data failure.
- Recommended fix: Show a concise retryable catalog-unavailable state when any required query fails and keep empty states for successful zero-row results.
- Files involved: `lib/data/homepage.ts`, `components/home/homepage-catalog.tsx`, `components/home/home-empty-state.tsx`

### QA-029 — Server Action upload limit is unusually large

- Severity: Low
- Module: Performance / Image uploads / Security
- Root cause: The global Server Action body limit is 42 MB to accommodate eight images. Large multipart submissions consume serverless memory and time and provide no byte-level upload progress.
- Recommended fix: Use signed direct-to-storage uploads with per-file limits and progress, then submit a small validated manifest to the Server Action.
- Files involved: `next.config.ts`, `components/admin/product-images-field.tsx`, `app/admin/(protected)/products/actions.ts`

### QA-030 — No global route error boundaries are defined

- Severity: Low
- Module: Error handling / Accessibility
- Root cause: The app has loading and not-found states but no scoped `error.tsx` or root `global-error.tsx`. Unexpected render/data exceptions fall back to framework behavior without a branded recovery action.
- Recommended fix: Add accessible error boundaries at public and protected-admin scopes with retry/navigation actions and structured server logging.
- Files involved: `app/`, `app/admin/(protected)/`

### QA-031 — Actual mobile and assistive-technology behavior remains unverified

- Severity: Medium
- Module: Mobile responsiveness / Accessibility
- Root cause: Code includes responsive grids, scroll containers, 44–48 px controls, skip links, labels, and focus styles, but no automated accessibility tests or browser-based viewport/screen-reader evidence exists. The audit environment had no interactive browser.
- Recommended fix: Execute the launch checklist on iOS Safari, Android Chrome, desktop keyboard-only, VoiceOver, and NVDA; run axe at representative routes and states. Treat horizontal overflow, focus loss, inaccessible errors, or dialog failures as release blockers.
- Files involved: `app/globals.css`, `components/layout/*`, `components/admin/*`, `components/product/*`, `components/search/*`

## RLS and authorization assessment

The intended model is sound: public reads are constrained to active/published/eligible rows; authenticated writes require an active `admin_users` record; Server Actions re-check admin access; the affiliate redirect alone uses the server-only secret client. No browser code reads `SUPABASE_SECRET_KEY`.

Launch confidence is still conditional on the deployed migration state. Verify grants and policies from migrations 002–019 in production, especially admin read/write policies, offer DELETE, RPC execute grants, product-image table/storage policies, knowledge-hub buckets, and affiliate analytics access. Do not disable RLS or add public write policies.

## Positive observations

- Unauthenticated admin routes redirect to `/admin/login`.
- Admin authorization is checked in Proxy, protected layout/data loaders, and mutation actions.
- Supabase browser/server clients use the publishable key; the secret key remains server-only.
- Affiliate destinations are restricted to HTTP(S), require published products, active offers, and active merchants, and use sponsored/nofollow/noopener/noreferrer links.
- Public pages include canonical metadata, Open Graph, Twitter metadata, robots, sitemap, manifest, and JSON-LD, subject to correcting the configured host.
- Forms generally have explicit labels, touch-size controls, focus-visible styles, and validation messages.
- Product images are signature-checked server-side and the private bucket has MIME and size restrictions in migration 018.
- No unrestricted public writes or globally disabled RLS were found.

## Manual test limitations

The following were not claimed as passed: authenticated admin dashboard data, create/edit/deactivate flows, duplicate-slug behavior in production, real upload/crop/camera flows, offer redirect to a real merchant, responsive visual layout, keyboard focus order, screen-reader announcements, Core Web Vitals, and RLS behavior for inactive records. These are mandatory checks in `docs/LAUNCH_CHECKLIST.md`.
