# HypeBuzz Next Roadmap

**Basis:** 2026-07-30 project audit. The current launch classification is **Needs Major Fixes**. Priorities below favor proof and operational safety before new features.

## Immediate — must fix now

1. **Establish the deployed database truth.** Run and export the read-only production verification SQL; inspect the Supabase migration ledger; update stale expected policy names; compare every table/column/function/trigger/index/bucket/RLS policy/grant/constraint with migrations 001-028. Do not replay historical migrations blindly.
2. **Reconcile staging first.** Produce only forward, idempotent migrations for proven drift; test them on a production-like restore; verify anon, authenticated non-admin, active admin, and inactive admin access.
3. **Run the complete authenticated workflow in staging.** Cover login -> Add Product -> JSON preview/apply -> image upload/edit -> save draft -> edit -> publish -> product page -> compare -> affiliate redirect. Capture screenshots/logs/DB rows and include failure injection at every write boundary.
4. **Configure the affiliate server secret and prove revenue flow.** Add `SUPABASE_SECRET_KEY` to the correct server environments, verify it never reaches the client, validate click insertion and fallback behavior, and add safe error logging/alerts.
5. **Repair catalog correctness.** Replace the 100-row in-memory search/category pipeline with indexed database-side filtering/sorting/pagination and accurate totals. Define or remove “Popular.”
6. **Harden image persistence.** Validate direct/server upload limits on the target host, define storage compensation/orphan reconciliation, verify migration-027 policies, and decide whether external images are ingested or allowlisted.
7. **Add error recovery and production observability.** Implement root/scoped error boundaries, structured/redacted logging, correlation IDs where appropriate, error monitoring, and alerts for auth, product saves, storage, DB drift, and affiliate failures.
8. **Gate the repository.** Add CI for lint, the 52 tests, production build, and a corrected standalone TypeScript check; remove the obsolete `onBrandResolved` test prop.

### Immediate exit criteria

- Production schema verification has no unexplained missing/mismatched/security rows.
- A clean staging E2E run proves every required workflow step and rollback path.
- Affiliate redirect/click tracking works with production-equivalent configuration.
- Search/category results remain correct beyond 100 products and are paginated.
- CI and monitoring are active; no critical/high issue is accepted without explicit launch sign-off.

## Short term

1. Add Playwright (or equivalent) browser E2E for admin auth/CRUD/import/images/publish, storefront discovery/detail/compare, and affiliate redirect.
2. Add Supabase integration/RLS tests for anon, non-admin, active/inactive admin, RPC signatures, constraints, and private Storage buckets.
3. Refactor the oversized product Server Action into focused authorization, validation, persistence, storage, and compensation services while preserving transactional boundaries.
4. Make compare use shared offer eligibility, stop returning raw affiliate URLs unnecessarily, add a tracked outbound action, and test API/UI/network/localStorage behavior.
5. Define offer freshness SLA; exclude or clearly label stale prices in pages, structured data, and redirect eligibility.
6. Make failures distinct from empty states on the homepage, dashboard, search, category, product, guide, and analytics views.
7. Complete keyboard/focus/Escape behavior for image and deletion dialogs; run axe, keyboard, zoom, reduced-motion, VoiceOver/NVDA checks.
8. Validate canonical domain/DNS/Vercel environment, redirects, robots, sitemap, OpenGraph assets, and representative Product structured data.
9. Remove or clearly label `/admin/import`, `/admin/settings`, UI-only support forms, sample market data, and unfinished destinations according to launch scope.
10. Regenerate Supabase TypeScript types from the reconciled database and review relationship/default differences.

## Medium term

1. Add real popularity/ranking inputs based on privacy-reviewed events; separate trending, newest, and popular semantics.
2. Add offer ingestion/update tooling, merchant feed health, stale-offer dashboards, and scheduled checks.
3. Build a public blog experience or retire the unused blog management surface.
4. Decide and implement dedicated brand/merchant public pages and align footer/navigation/revalidation.
5. Implement secure contact/report/suggest-product submissions with abuse protection, retention/privacy policy, acknowledgements, and operator workflow.
6. Add admin audit history for sensitive catalog and role-affecting actions.
7. Add performance budgets and production measurement for LCP/INP/CLS, database query latency, private image delivery, Server Action memory/time, and cache hit rate.
8. Add backup/PITR verification, restore rehearsal, release migration checklist, and rollback runbooks.

## Long term

1. Introduce automated merchant feeds/APIs and robust price history while respecting affiliate terms.
2. Add personalized alerts/wishlists only after customer identity, consent, security, and notification architecture are designed.
3. Build editorial/recommendation governance, ranking explainability, and quality review workflows.
4. Add multi-region/currency/locale support only after currency aggregation and offer semantics are redesigned.
5. Establish SLOs, incident response, capacity testing, data retention, security review, and regular dependency/database policy audits.

## Recommended launch gates

| Gate | Required evidence |
|---|---|
| Database | Exported schema/RLS/grants verification; reconciled ledger; staging migration rehearsal |
| Security | Role-matrix tests; secrets verified; no public writes; private bucket access proven |
| Workflow | Browser E2E of every requested product step and rollback/failure paths |
| Revenue | Real tracked affiliate redirect with monitored failure fallback |
| Quality | CI-green lint/tests/type/build/E2E; no unexplained high-severity issue |
| Operations | Error monitoring, alerts, logs, backup/restore and rollback runbooks |
| SEO/performance | Canonical/domain/rich-results checks and agreed Core Web Vitals/query budgets |
| Product scope | Placeholder/sample/nonfunctional surfaces removed or explicitly accepted |

Once the Immediate exit criteria are met, the repository could reasonably be reassessed as **Ready for Beta**. Production readiness requires the Short Term security, accessibility, observability, performance, and operational gates as well.
