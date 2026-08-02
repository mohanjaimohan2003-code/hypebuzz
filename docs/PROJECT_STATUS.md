# HypeBuzz Project Status Audit

**Audit date:** 2026-07-30  
**Scope:** current working tree, including pre-existing uncommitted compare work  
**Method:** repository inspection, migration/code comparison, lint, tests, TypeScript check, and production build. No application code or database state was changed.

## Executive assessment

**Launch readiness: Needs Major Fixes.** The repository is a substantial beta-stage application, not a prototype: its storefront, protected catalog administration, product/offers/images workflow, SEO, and affiliate redirect architecture exist, all 52 current unit/component tests pass, ESLint passes, and `next build` succeeds. It is not production-ready because the deployed Supabase schema has not been fully reconciled to migrations 001-028, the live admin workflow has no current end-to-end proof, the affiliate redirect requires an unconfigured local secret, public search/category queries cap and filter results in memory, and runtime observability/error recovery are incomplete.

## 1. Project overview

### Tech stack

- Next.js 16.2.10 App Router/Turbopack with React 19.2.4 and TypeScript 5 (strict mode).
- Tailwind CSS 4 through PostCSS.
- Supabase Auth, PostgreSQL/PostgREST, RLS, RPCs, and Storage via `@supabase/ssr` and `@supabase/supabase-js`.
- React Server Components, Server Actions, route handlers, and a Next.js `proxy` for admin session refresh.
- `react-easy-crop` plus browser Canvas for product image editing.
- Node test runner through `tsx`; ESLint 9 / `eslint-config-next`.
- Expected deployment shape: Next.js/Vercel plus hosted Supabase; canonical public origin defaults to `https://hypebuzz.in`.

### Architecture

The application is a single Next.js codebase. `app/` contains public storefront routes, a protected admin route group, route handlers, metadata routes, and company pages. `components/` contains feature/presentation UI. `lib/` separates Supabase clients, data access, validation, product-import normalization, publication rules, SEO, affiliate tracking, and shared types. `supabase/migrations/` is the intended database history; `supabase/verification/` contains a read-only live-schema checker. There is no separate service/API layer, background worker, or queue.

### Folder structure and major modules

| Path | Responsibility |
|---|---|
| `app/admin/(protected)` | Dashboard; product, offer, brand, category, merchant, blog, guide, and analytics administration |
| `app/products`, `app/categories`, `app/search`, `app/trending` | Public catalog discovery and detail pages |
| `app/compare`, `app/api/compare` | Browser-persisted, up-to-four-product comparison |
| `app/go/[offerId]` | Validated affiliate redirect and click tracking |
| `app/product-images/[id]` | Controlled delivery of private stored product images |
| `components/admin` | CRUD forms, JSON importer, tables, image crop/reorder/upload UI |
| `lib/data` | Supabase reads and storefront/admin view models |
| `lib/validation` | Server-side form and query validation |
| `lib/offers` | Shared publication and price-comparison contract |
| `lib/admin/product-import` | Parse, normalize, match, preview, and apply imported JSON |
| `supabase/migrations` | 28 ordered schema/security migrations |
| `tests` | 52 tests across publication, JSON import, rich fields, and compare selection |

### Deployment readiness

- **Build:** pass. `npm run build` completed TypeScript, 70 static page generations, and route optimization.
- **Lint:** pass.
- **Tests:** 52/52 pass when child processes are permitted.
- **Standalone `tsc --noEmit`:** fails only in a test call that supplies removed prop `onBrandResolved`; Next's production build succeeds because its generated build tsconfig excludes tests. This is still a test-source defect.
- **Environment:** local `.env.local` has the Supabase URL/publishable key and Google verification; it does **not** have `SUPABASE_SECRET_KEY`, so `/go/[offerId]` cannot resolve locally. Production environment values were not available for verification. `NEXT_PUBLIC_SITE_URL` is optional and absent locally; code falls back to `https://hypebuzz.in`.
- **Database:** repository schema is defined, but current live equivalence is unproven. The latest repository evidence in `docs/DATABASE_AUDIT.md` found non-sequential production drift. Later migration comments (022, 027, 028) also explicitly describe production prerequisites that had been missing. Run `supabase/verification/verify_production_schema.sql` and retain its output before launch.

## 2. Database audit

### Tables used by application code

`admin_users`, `affiliate_clicks`, `blog_categories`, `blog_posts`, `blog_tags`, `blog_post_tags`, `brands`, `categories`, `knowledge_hub_items`, `merchants`, `product_images`, `product_offers`, and `products`. All 13 have repository migrations and local TypeScript row types.

### Intended cumulative schema

- Core catalog: categories, brands, products, merchants, offers.
- Identity/security: `admin_users` linked to `auth.users`.
- Analytics: `affiliate_clicks` with nullable `ON DELETE SET NULL` references.
- Content: four blog tables and `knowledge_hub_items`.
- Media: `product_images` plus three private Storage buckets.
- Product extensions added after the base schema: category ordering; brand details; merchant affiliate fields; product highlights/SEO; offer title/shipping note; required image records.

### Migrations and mismatches

- Migrations 001-028 are present and numerically ordered, but the repository has no Supabase CLI migration ledger/config proving which files are applied remotely.
- 020 is labelled a gated forward migration; 022 restores an RPC confirmed absent in production on 2026-07-26; 027 reconciles required product images; 028 restores prerequisites required by 027. These files document historical live drift, not proof that drift has since been fixed.
- The hand-maintained `lib/types/database.ts` represents current repository columns/functions but has empty relationship metadata and permissive generated insert shapes. It is not evidence of the live schema.
- `supabase/README.md` is stale: it describes running only through migration 016 and says product CRUD is not implemented.
- `supabase/verification/verify_production_schema.sql` is itself stale at one point: it expects old product-image public policy names while migration 027 replaces them with `Public can read complete published product images` and `Published product image objects are readable`. Verification output therefore needs interpretation/update before treating these rows as missing.

### Missing migrations / columns / unused tables

- **Repository:** no table or called RPC lacks a migration. No definite missing repository column was found against the local types and query payloads.
- **Live database:** unknown as of this audit; do not claim 020-028 are deployed without SQL output. Historical read-only probes in `docs/DATABASE_AUDIT.md` found missing category/brand/product-image/offer additions and absent search/blog objects.
- **Unused or weakly used schema:** `search_products` and `search_category_products` RPCs are defined and typed but public pages use direct reads plus application-side filtering. `amazon_asin` is stored but has no meaningful user-facing/admin workflow. `affiliate_tracking_parameter` is managed but not used to construct destinations. Blog admin tables exist, but there is no public blog route.

### RLS, grants, and constraints (repository intent)

- RLS is enabled in migrations for all 13 public application tables. Public catalog reads are predicate-limited; active admins receive broader reads/writes through `admin_users` membership.
- Anonymous mutation grants are revoked. Authenticated admins receive catalog mutation grants; offers and selected content tables allow delete where needed.
- Affiliate click insertion is intentionally reserved for the server secret client; authenticated admins receive summary/read access.
- Product publication is guarded by deferred constraints/RPC validation; migration 027 additionally requires at least one product image. Products/offers/images use cascading ownership; click history uses set-null references.
- Core uniqueness, slug, nonblank, price, currency, availability, status, JSON-shape, image-source, primary-image, FK, and size constraints are defined.
- **Live RLS/grants/constraints remain unverified.** The 2026-07-26 audit found a broken combined public/admin policy pattern in older knowledge-hub/product-image migrations; migration 027 appears to repair image policies, but live policy state must be checked.

## 3. Product workflow audit

| Step | Status | Evidence and reason |
|---|---|---|
| Login | **Partially Working** | Email/password login, session proxy, protected layout, active-admin lookup, sign-out, and access-denied routes exist. No current live admin/auth smoke test; infrastructure errors are collapsed into denied/unauthenticated states. |
| Add Product | **Partially Working** | Full form and server action exist with categories, brand resolution, images, offers, rich fields, and validation. Depends on RPC/schema state not proven live. |
| Paste JSON | **Working (code/test)** | 100 KB input, syntax/schema checks, prototype-key rejection, and preview-first behavior; importer tests pass. |
| Auto Fill | **Working (code/test)** | Normalization/matching and controlled field application are tested. Unknown category/merchant stays unresolved; a missing brand is resolved/created at save. Import deliberately does not replace images. |
| Upload Image | **Partially Working** | File/URL input, crop, reorder, primary selection, MIME/size/count validation, Storage upload, and image RPC exist. No maximum-size/live-storage E2E proof; 42 MB Server Action body creates deployment risk; storage compensation is incomplete. |
| Save Draft | **Partially Working** | Server validation and create/edit actions exist; current contract requires an image even for draft. Atomic DB RPC exists for create, but rich-field/storage follow-ups and cleanup cross transaction boundaries; live RPC state is unknown. |
| Publish | **Partially Working** | UI/server/database publication contracts require active category, image, eligible active merchant/offer, URL, price, currency, and availability. Live triggers/RPCs/migrations are not verified. |
| Product Page | **Working with fixes needed** | Published-only query, gallery, rich content, offers, related products, metadata, and JSON-LD exist. Missing error boundary, stale-offer policy, arbitrary external images, and some JSON-LD semantics remain. |
| Compare Product | **Partially Working** | Up to four IDs persist in localStorage; endpoint and comparison/spec/offer UI exist; three selection tests pass. Work is uncommitted, API returns raw affiliate URLs unnecessarily, eligible-offer semantics are duplicated, and there is no click-through action or E2E test. |
| Affiliate Link | **Partially Working / locally broken** | Public buttons route through `/go/{offerId}`; handler validates active offer/product/merchant and safe HTTP(S) URL, attempts analytics, then redirects. `SUPABASE_SECRET_KEY` is absent locally and production presence is unknown, so the route falls back to unavailable locally; failures are swallowed without actionable logs. |

## 4. Code quality

### TODOs and placeholders

No conventional `TODO`/`FIXME` comments were found in runtime TypeScript. Functional placeholders do exist: `/admin/import` and `/admin/settings` render `AdminPlaceholderPage`; several company contact/report/suggestion forms are explicitly UI-only and disabled.

### Duplication and architecture concerns

- Large, highly coupled `app/admin/(protected)/products/actions.ts` mixes auth, diagnostics, brand creation, validation, DB orchestration, storage compensation, deletion, and navigation.
- Public search and category modules duplicate offer eligibility/filter/sort/mapping logic and load up to 100 rows for in-memory processing.
- Compare reimplements offer validity rather than using the shared publication contract and returns `affiliate_url` to the browser despite not displaying a buy link.
- Validation/error helpers and long Tailwind class strings are repeated across admin forms.
- Database types are manually curated rather than generated from the verified live schema.
- Storage writes cannot be atomic with PostgreSQL writes; compensation and orphan reconciliation are not complete.
- The 42 MB Server Action limit accommodates eight 5 MB files but risks serverless memory/time/body-size limits.

### Dead/unused code and APIs

- Search/category RPCs are not called by current public pages.
- `AdminPlaceholderPage` is intentionally used only for incomplete Import/Settings.
- Sample catalog/market modules and sample SVG products remain; the market bar is hard-coded sample data.
- No public blog route consumes the implemented blog administration schema.
- `affiliate_tracking_parameter` and `amazon_asin` have little/no runtime consumption.

### Tests, logging, errors, and validation

- Tests cover publication rules, JSON import, rich product fields/rendering, and compare selection. They do not cover auth/RLS, live Supabase RPCs, CRUD E2E, image Storage, affiliate redirect/click insertion, search/category correctness at scale, SEO routes, accessibility, or deployment smoke tests. No CI workflow was found.
- Logging is ad hoc `console.error/info/warn`; there is no structured logger, request correlation, error monitoring, metrics, or alerting. Some affiliate/auth exceptions are silently swallowed.
- No `error.tsx` or `global-error.tsx` boundary exists. Many data loaders turn failures into empty states, potentially disguising outages as no content.
- Server-side validation is comparatively strong for catalog inputs, URLs, UUIDs, product publication, offers, import payloads, images, brands/categories/merchants, and query filters. Constraints add defense in depth, subject to live deployment verification.

## 5. Top production blockers

1. **Reconcile and verify the live database.** Export the complete read-only verification output, migration ledger, policies, grants, functions, triggers, buckets, and constraints; then prove 020-028 are safely applied.
2. **Run an authenticated staging E2E workflow.** Login -> import -> image upload -> draft -> publish -> public detail -> compare -> affiliate redirect, including rollback/failure cases.
3. **Configure and verify affiliate secret/click tracking.** Without `SUPABASE_SECRET_KEY`, redirects always degrade to unavailable; analytics failures currently lack operational visibility.
4. **Fix search/category correctness and scale.** The 100-row pre-filter cap, 48-result slice, missing pagination/accurate totals, and fake `popular` sort make catalog results incomplete.
5. **Add production error handling and observability.** Error boundaries, structured logs, monitoring/alerts, and explicit failure states are absent.
6. **Resolve image upload delivery risk.** Validate serverless limits, storage policies, compensation/orphan cleanup, arbitrary external-host policy, and private image route behavior.
7. **Complete launch-scope decisions.** Remove/mark Import and Settings placeholders, UI-only support forms, sample financial data, and any unfinished public destinations.
8. **Add CI and E2E/security coverage.** Current passing unit tests do not exercise Supabase or a browser workflow.

## 6. Verification record and limitations

Commands executed on 2026-07-30:

- `npm.cmd test`: **pass, 52/52**.
- `npm.cmd run lint`: **pass**.
- `npm.cmd run build`: **pass**, 70 static pages generated.
- `.\\node_modules\\.bin\\tsc.cmd --noEmit`: **fail**, `tests/product-json-import.test.ts:166` passes obsolete `onBrandResolved` prop. This test still transpiles and passes under `tsx`.

No browser automation, live authenticated Supabase write, Storage mutation, affiliate redirect, deployment inspection, or SQL editor verification was performed. Database statements in this report therefore distinguish repository intent and historical evidence from current live proof.
