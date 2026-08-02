# HypeBuzz Feature Matrix

**Audited:** 2026-07-30 against the current working tree.  
Legend: ✅ Complete; 🟡 Partially Complete; ❌ Not Started; ⚠️ Needs Fixes.

“Complete” means the repository contains a coherent implementation and proportionate automated evidence. Anything dependent on unverified live Supabase state is capped at partial.

| Feature | Status | Evidence / gap |
|---|---:|---|
| Authentication | 🟡 | Supabase email/password login, session refresh proxy, active-admin allowlist, protected layout, access denied, and sign-out exist. No recovery/MFA/rate-limit flow or current live role/RLS smoke test; outages are misclassified. |
| Admin Dashboard | 🟡 | Live count/recent-product/analytics modules and responsive shell exist. Failed metrics can appear as zero; quick-action semantics and placeholders remain; no E2E. |
| Categories | 🟡 | Admin create/edit/enable/disable/list/search/order and public category pages exist. Live schema/category authority is unverified; public query caps at 100 and registry fallback can produce thin pages. |
| Brands | 🟡 | Admin list/create/edit/enable/disable, importer matching/creation, and storefront display/filter exist. No dedicated public brand page; live optional columns unverified. |
| Merchants | 🟡 | Admin list/create/edit/enable/disable and offer integration exist. Tracking parameter is stored but unused; no dedicated public page; live workflow unverified. |
| Add Product | 🟡 | Full form, import, rich fields, images, offers, validation, and create orchestration exist. Live RPC/migration/Storage path and compensation are unverified. |
| Edit Product | 🟡 | Edit route/form, image/offer replacement, rich fields, reactivation, and validation exist. Cross-resource atomicity and live E2E are missing. |
| Delete Product | 🟡 | Archive plus typed-confirmation permanent delete RPC and image cleanup exist. Requires migrations 025/026 live; cleanup can finish with an unverified warning. |
| Product List | ✅ | Protected admin list supports query/status/category filters, status badges, actions, and loading state. Runtime failure handling still merits improvement. |
| Product Details | 🟡 | Published-only detail, gallery, highlights/specs, price comparison, related products, metadata, and JSON-LD exist. Freshness/external images/JSON-LD and failure recovery need fixes. |
| Category Pages | ⚠️ | Responsive page and filters exist, but results are selected from only the newest 100 records, sliced to 48, and may rely on static mapping rather than an active DB category. |
| Compare Products | 🟡 | Up-to-four localStorage selection, API, cards, specification table, offers, remove/clear, and tests exist. Uncommitted; no E2E, no compare-page affiliate action, duplicated eligibility logic, raw affiliate URLs over-fetched. |
| Search | ⚠️ | Query across product/brand/merchant plus filters and sorting exist. In-memory processing after a 100-row cap yields incomplete results; no pagination/accurate total; `popular` equals newest. |
| Filters | ⚠️ | Category, brand, merchant, price, discount, availability, best-price, and sort controls exist. Dataset cap makes results semantically incorrect at scale; filter options/errors are not fully isolated. |
| JSON Product Import | ✅ | Preview-first, 100 KB JSON parser, normalization, reference matching, warnings, prototype-key defense, partial application, and 20 passing tests. It intentionally lives inside Add Product; `/admin/import` remains a placeholder. |
| Image Upload | 🟡 | Up to eight JPG/PNG/WebP images, 5 MB validation, camera/drop, crop/rotate, reorder, primary image, external URL, private bucket, and proxy route exist. No live/storage E2E; 42 MB Server Action and orphan cleanup risks remain. |
| Product Offers | 🟡 | Embedded multi-offer and standalone CRUD/list/disable/delete, shared publication validation, price comparison, coupons/shipping/title exist. Live grants/functions and freshness behavior unverified. |
| Affiliate Links | ⚠️ | `/go/[offerId]` validates destination and active entities, tracks clicks with secret client, and redirects. Local secret is absent, production secret unknown, insert errors are not checked/logged, and all route errors are swallowed. |
| SEO | 🟡 | Metadata, canonical URLs, OpenGraph/Twitter, robots, sitemap, Product/Breadcrumb JSON-LD, and Google verification exist. Canonical environment/domain and representative rich-result validation are unverified; search page canonical drops queries by design. |
| Responsive Design | 🟡 | Extensive responsive grids/nav/forms/tables and touch-sized controls exist; selected tests assert mobile class contracts. No device/browser/zoom/assistive-tech test matrix. |
| Performance | ⚠️ | Server components, caching, loading states, static generation, and image cache headers exist. Search/category over-fetch and in-memory work, unoptimized external `<img>`, 42 MB actions, no pagination, and private image proxying need measurement/fixes. |
| Error Handling | ⚠️ | Forms return field/global errors and routes have not-found/loading/fallback states. No route/root error boundaries; data failures often collapse to empty; affiliate catches are silent. |
| Logging | ⚠️ | Supabase failures have some contextual console diagnostics. Logging is inconsistent; no centralized redaction/correlation, monitoring, metrics, alerts, or audit trail. |
| Validation | ✅ | Strong server validation plus database constraints for core catalog, offer/publication, UUID/URL, import, image, query, and content inputs. Live database constraints still need verification. |
| Analytics | 🟡 | Affiliate click table/summary and admin analytics page exist. Secret/runtime insertion and production data integrity are unverified; no general product popularity metric. |
| Blog | 🟡 | Admin CRUD/taxonomy and schema exist. No public blog index/detail routes, so it is not a complete publishing feature. |
| Knowledge Hub | 🟡 | Admin PDF/thumbnail CRUD/publish and public list/detail/download paths exist. Live bucket/RLS policy behavior and E2E remain unverified. |
| Admin Import Page | ❌ | `/admin/import` is a placeholder. Product JSON import is implemented in Add Product, but this named navigation destination is not. |
| Admin Settings | ❌ | `/admin/settings` is a placeholder with no settings persistence. |
| Support Forms | ❌ | Contact/report/suggest-product forms are explicitly UI-only/disabled; no submission backend exists. |

## Automated evidence

| Check | Result |
|---|---|
| Publication contract tests | 15 passed |
| Product JSON import tests | 20 passed |
| Rich product field tests | 14 passed |
| Compare selection tests | 3 passed |
| ESLint | Passed |
| Next.js production build | Passed; 70 static pages generated |
| Standalone TypeScript over tests | Failed on obsolete test-only `onBrandResolved` prop |

There are no auth/RLS, database integration, image Storage, affiliate redirect, browser E2E, accessibility, performance, or deployment smoke tests.
