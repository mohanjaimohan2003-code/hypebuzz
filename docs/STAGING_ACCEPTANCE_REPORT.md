# HypeBuzz Staging Acceptance Report

**Assessment date:** 2026-08-01  
**Target:** reliable owner testing on Vercel; this is not a production-readiness approval.

## A. Repository status

- Branch: `main`; HEAD: `d674ad3` (`Restore product image prerequisites`); `origin/main` was at the same commit when inspected.
- The working tree contains substantial intended uncommitted application, compare-page, test, documentation, migration 029/030, and verification work. Nothing was reset or discarded.
- Current gates pass: `npm test` **62/62**, `npm run lint` **pass**, `npm run build` **pass**, including TypeScript and 70 generated routes on Next.js 16.2.10.
- The canonical SEO fallback and report-form URL example now use `https://hypebuzzshop.in`. Historical audit reports mentioning earlier domains remain unchanged as historical evidence.

## B. Supabase status

- Local configuration contains a Supabase URL and publishable key, but no database-owner credential, authenticated admin session, or `SUPABASE_SECRET_KEY`.
- Production schema state cannot be queried or changed from this workspace.
- [pre_launch_verification.sql](../supabase/verification/pre_launch_verification.sql) is a read-only inventory for tables, columns, indexes, constraints/foreign keys, functions, triggers, RLS, policies, grants, buckets, migration records, and orphans.
- Production reconciliation remains unproven until the owner runs and exports the verification results.

## C. Migrations applied/not applied

- Migration 029: repository review **approved for controlled application**; production application **not confirmed**. It performs product/brand/image/offer persistence in one database transaction, preserves existing rows, retains active-admin authorization, revokes anonymous/public execution, and grants execution only to `authenticated`.
- Migration 030: repository review **approved for controlled application**; production application **not confirmed**. It repairs public read evaluation through scoped `SECURITY DEFINER` predicates, keeps buckets private, restricts reads to published linked records, preserves admin write policies, and adds no anonymous writes.
- Neither migration was applied automatically because the production project and database-owner access were unavailable.

## D. Vercel status

- Git remote: `https://github.com/mohanjaimohan2003-code/hypebuzz.git`; branch expectation: `main`.
- No `.vercel/project.json` and no Vercel CLI are available. GitHub CLI reports no authenticated host, so no commit, push, or deployment was performed.
- Direct smoke check of the previously known deployment `https://hypebuzz.vercel.app` on 2026-08-01: `/` 200, `/search` 200, `/robots.txt` 200, `/sitemap.xml` 200, `/admin` redirected to `/admin/login` and returned 200; `/categories` 404; `/compare` 404. This deployment predates the uncommitted compare work and is not proof of the current version.
- `hypebuzzshop.in` did not resolve in DNS from the verification environment. Domain attachment/DNS is therefore not ready or not externally propagated.

## E. Environment variable status

- Local present: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Local missing: `SUPABASE_SECRET_KEY`, `NEXT_PUBLIC_SITE_URL`.
- Local `GOOGLE_SITE_VERIFICATION`: empty and optional.
- Legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY`: not referenced and not required.
- Vercel values/scopes: unverified. Exact requirements are in [VERCEL_ENVIRONMENT_CHECKLIST.md](./VERCEL_ENVIRONMENT_CHECKLIST.md).

## F. Product workflow result

Automated transaction, validation, retry, and duplicate-slug contracts pass. A real authenticated create/edit/publish flow against production was not run. The required three-product acceptance test and database row verification remain pending.

## G. Image delivery result

Migration 030 and its policy contracts pass repository tests. No known valid deployed product/image ID was available to prove `/product-images/[id]` returns 200, and production policy state is unconfirmed. Draft privacy and replacement/deletion cleanup remain pending.

## H. Affiliate redirect result

Destination validation and safe failure contracts pass automated tests. Production `SUPABASE_SECRET_KEY`, live click insertion, active/inactive offer behavior, invalid UUID behavior, unpublished-product behavior, and Amazon redirect were not proven against the deployed environment.

## I. Remaining blockers

1. Owner must export the production verification results and reconcile any drift.
2. Migrations 029 and 030 must be applied if their verified objects are absent/mismatched.
3. Vercel Production variables, especially `SUPABASE_SECRET_KEY` and `NEXT_PUBLIC_SITE_URL`, must be configured and verified.
4. Intended working-tree changes must be reviewed, committed, and pushed to `main`; the current reachable deployment does not contain `/compare`.
5. `hypebuzzshop.in` DNS/domain attachment must resolve and point to the successful Vercel production deployment.
6. Deployed smoke testing needs a valid category slug and product slug; `/categories` currently has no index route and returns 404 on the old deployment.
7. Three authenticated disposable-product runs, public image HTTP 200, duplicate protection, cleanup, compare, and affiliate click/redirect still need production evidence.

## J. Exact manual actions required from owner

1. Follow [SUPABASE_OWNER_ACTIONS.md](./SUPABASE_OWNER_ACTIONS.md) in the confirmed production Supabase project and save all SQL outputs.
2. In Vercel, connect `mohanjaimohan2003-code/hypebuzz`, set Production Branch to `main`, Framework Preset to Next.js, Install Command to `npm install` (or default), Build Command to `npm run build`, and leave Output Directory at the Next.js default.
3. Configure every required Production variable exactly as listed in [VERCEL_ENVIRONMENT_CHECKLIST.md](./VERCEL_ENVIRONMENT_CHECKLIST.md).
4. Review the existing working tree, then from the repository root run `git status`, `git diff --check`, `git add --all`, `git diff --cached`, `git commit -m "Prepare HypeBuzz staging acceptance"`, and `git push origin main`. Do not commit unless the staged diff contains only intended sprint work.
5. In Vercel, verify the pushed commit produced a successful Production deployment. Attach `hypebuzzshop.in`, configure the DNS records Vercel displays, make it the primary domain, and redirect the Vercel hostname to it after validation.
6. Re-run route smoke tests on the new deployment using `/`, `/search`, a valid `/categories/[slug]`, a valid `/products/[slug]`, `/compare`, `/robots.txt`, `/sitemap.xml`, and `/admin`.
7. Complete and record the three-product, image, duplicate, cleanup, and affiliate acceptance tests described in the Supabase owner actions.

# BLOCKED — OWNER ACTION REQUIRED
