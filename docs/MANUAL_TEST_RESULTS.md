# HypeBuzz Manual Test Results

Last updated: 2026-07-26  
Purpose: Permanent evidence log for checks that cannot be proven by repository tests alone.

## Recording rules

For each execution, record:

- Test ID or linked QA issue
- Date/time and tester
- Environment and canonical URL
- Commit SHA and deployment ID
- Supabase project reference/environment (never credentials)
- Browser, OS, device, and viewport where relevant
- Preconditions/test data
- Steps
- Expected result
- Actual result
- Result: Pass / Fail / Blocked / Not Run
- Evidence link or safe log reference
- Follow-up defect/owner

Do not record passwords, tokens, cookies, secret keys, personal data, or complete affiliate credentials in this file.

## Baseline evidence from QA audit

These results predate implementation phases and do not verify any fix.

| Test | Environment | Result | Evidence/observation | Follow-up |
|---|---|---|---|---|
| Public homepage route | `https://hypebuzz.vercel.app/` | Pass (HTTP only) | HTTP 200 during 2026-07-26 QA audit. No interactive visual assertion. | Re-run in Phase 18 with viewport, accessibility, data, and performance checks. |
| Public search route | `/search` | Pass (HTTP only) | HTTP 200 during audit. | Search correctness/pagination remains Not Run; QA-005/011/018. |
| Trending query route | `/search?trending=true` | Fail | HTTP 200 but rendered ordinary Search products behavior; parameter is ignored in code. | QA-006, Phase 11. |
| Mobiles category route | `/categories/mobiles` | Pass (HTTP only) | HTTP 200. | Data accuracy and filters remain Not Run; Phases 10/12/18. |
| Registry-only category route | `/categories/laptops` | Fail | HTTP 200 empty/thin category page despite no confirmed active database category. | QA-009/027, Phase 10. |
| Unauthenticated admin route | `/admin` | Pass | Redirected to `/admin/login`. | Authenticated/non-admin/outage cases remain Not Run. |
| Unauthenticated categories admin route | `/admin/categories` | Pass | Redirected to `/admin/login`. | Authenticated CRUD remains Not Run. |
| Robots route | `/robots.txt` | Fail | HTTP 200, but Host/Sitemap advertised `https://hypebuzzshop.in`. | QA-008, Phase 14. |
| Sitemap route | `/sitemap.xml` | Pass (availability only) | HTTP 200. Domain/content correctness not accepted because QA-008 remains open. | Revalidate in Phase 14/18. |
| Manifest route | `/manifest.webmanifest` | Pass (HTTP/content smoke) | HTTP 200 with HypeBuzz manifest payload. | Installability/icons/device behavior remain Not Run. |
| Production category schema probe | Configured Supabase REST endpoint | Fail | Query with `display_order` returned HTTP 400 / PostgreSQL 42703; compatible query returned Mobiles. | QA-003, Phase 1. |

## Current manual test matrix

| Area | Status | Blocking reason / next phase |
|---|---|---|
| Production migration ledger and effective schema | Blocked | Partial read-only REST evidence collected; full owner-level SQL verification and migration history export still require Supabase Dashboard access. |
| Production RLS/grants/RPC/storage policy matrix | Blocked | Repository definitions audited; effective catalog and authenticated anon/non-admin/admin behavior still require Supabase access and test identities. |
| Product publication combinations | Blocked | Repository contract/tests are complete; proposed migration 020 and admin/public behavior require verified staging database state. |
| Atomic failure injection | Not Run | Transaction/compensation design required in Phases 3 and 9. |
| Categories CRUD | Not Run | Active admin staging session required after Phase 4. |
| Brands CRUD | Not Run | Active admin staging session required after Phase 5. |
| Merchants CRUD | Not Run | Active admin staging session required after Phase 6. |
| Products CRUD | Not Run | Depends on Phases 2–7. |
| Offers CRUD/readiness | Not Run | Depends on Phases 2, 3, and 8. |
| Image upload/crop/camera/cleanup | Not Run | Real storage plus desktop/iOS/Android required after Phase 9. |
| Public category states | Not Run | Requires database-driven implementation in Phase 10. |
| Navigation and unfinished routes | Not Run | Product-scope decisions and Phase 11 implementation required. |
| Search correctness and pagination | Not Run | Large deterministic staging fixture required after Phase 12. |
| Affiliate redirect and click analytics | Not Run | Fresh/stale/inactive fixture and server monitoring required after Phase 13. |
| Canonical domain/SEO | Not Run | Canonical-domain decision and deployed Phase 14 configuration required. |
| Failure UI/logging/monitoring | Not Run | Fault injection and Vercel log/alert access required after Phase 15. |
| Responsive/accessibility matrix | Not Run | Interactive browsers/devices/assistive technology required after Phase 16. |
| CI enforcement | Not Run | Phase 17. |
| Final production smoke and rollback | Not Run | Phase 18 after all prior gates. |

## Phase result entries

### Phase 1 production read-only probes — 2026-07-26

Tester: Codex  
Environment: production Supabase project configured by the repository; publishable-key requests only  
Credentials/evidence: no key, token, cookie, row containing personal data, or secret was recorded

| Check | Expected cumulative schema | Actual result | Result |
|---|---|---|---|
| Base category read | Migration 001 columns readable | HTTP 200; active `Mobiles` row observed | Pass |
| Category ordering | `categories.display_order` from 008 | HTTP 400, PostgreSQL `42703` missing column | Fail |
| Brand editorial fields | `description`, `website_url` from 009 | HTTP 400, `42703` | Fail |
| Merchant affiliate fields | Fields from 010 | HTTP 200 | Pass |
| Public search RPC | `search_products` from 011 | HTTP 404, `PGRST202` | Fail |
| Affiliate summary RPC presence | RPC from 012; anon denied | HTTP 401 permission denied | Pass (presence/denial only) |
| Category search RPC | RPC from 013 | HTTP 404, `PGRST202` | Fail |
| Blog tables | Four tables from 014 | HTTP 404, `PGRST205` | Fail |
| Knowledge hub public read | Published rows readable under 017 | HTTP 401, permission denied for `admin_users` | Fail |
| Product images table | Table from 018 | HTTP 404, `PGRST205` | Fail |
| Price-comparison fields | `offer_title`, `shipping_note` from 019 | HTTP 400, `42703` | Fail |

The HTTP OPTIONS method was not accepted as evidence of mutation-RPC existence because the endpoint can return a generic CORS response. Migration 016 functions/triggers remain Blocked pending execution of the read-only catalog verifier.

Next manual action: run `supabase/verification/verify_production_schema.sql` in Supabase SQL Editor, export all result sets, record the project reference and timestamp, and attach the safe output to the Phase 1 review. Do not include credentials.

### Phase 2A publication contract — 2026-07-26

Repository automated evidence: 14/14 focused publication tests passed. No database migration was applied and no browser workflow was represented as verified.

Manual/database matrix pending after production reconciliation:

- publish with each of `in_stock`, `limited_stock`, and `pre_order`;
- reject publication with only `out_of_stock` or `unknown` offers;
- retain display-only out-of-stock/unknown offers when another eligible offer exists;
- accept null original price and equal original/current price;
- reject nonpositive current/original price and original below current;
- reject inactive category, inactive merchant, inactive only offer, invalid URL, invalid currency, and unsupported availability;
- remove/disable the last eligible offer and confirm the deferred trigger rejects the commit;
- verify public lowest price/store count uses only eligible offers;
- inspect JSON-LD mappings for all five availability states;
- verify checked date and “date unavailable” disclosure without treating freshness as an eligibility cutoff.

Status: **Blocked — proposed migration 020 must first be reviewed against verified production 016/019 signatures and applied to staging only.**

### Add Product JSON importer — 2026-07-26

Automated evidence: 15/15 importer tests passed, including complete/partial JSON, syntax errors, unknown references, price formats, deduplication, generated slug, URL validation, boolean aliases, manual-save isolation, image-state isolation, forbidden keys, incomplete FAQ handling, and collapsed responsive markup.

Manual checks remain Not Run:

- authenticated Add Product behavior at 320, 375, 768, and desktop widths;
- keyboard operation and screen-reader announcements through preview, cancel, apply, and clear;
- selected file/camera image persistence after preview, apply, and clear;
- exact slug/name/normalized matching against real staging categories, brands, and merchants;
- final server validation for duplicate slug, draft save, and manually approved publication.

### Rich product fields — 2026-07-26

Automated checks cover server normalization/payloads, importer application and preservation, conditional public rendering, SEO fallback, discount derivation, and responsive markup. All 42 project tests, lint, explicit TypeScript checking, and the 68-route production build pass. Browser and database verification are not complete.

Manual checks remain Not Run:

- complete production reconciliation, then review/apply migration 021 to staging;
- create and edit a draft with all five fields and verify stored JSON shapes;
- confirm import preserves images and existing values for omitted fields;
- verify populated and empty sections at 320, 375, 768, and desktop widths;
- inspect custom and fallback title, description, Open Graph, and Twitter metadata;
- confirm duplicate specification labels and unsafe keys show useful errors.
