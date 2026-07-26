# HypeBuzz Launch Checklist

Record tester, date, environment, commit SHA, Supabase project, browser/device, result, and linked defect for every check. All Critical and High defects in `docs/QA_REPORT.md` must be closed or explicitly accepted by the launch owner before release.

## Release controls

- [ ] Freeze the release commit and record its SHA.
- [ ] Confirm `npm run lint` passes.
- [ ] Confirm `npm run build` passes with production environment variables.
- [ ] Add and pass unit, integration, and end-to-end CI suites.
- [ ] Confirm no unrelated or unreviewed files are included in the release.
- [ ] Confirm monitoring, alerting, and rollback ownership.
- [ ] Back up Supabase and document recovery steps.
- [ ] Complete a staging smoke test using production-equivalent configuration.

## Environment and domain

- [ ] Confirm the single canonical launch domain.
- [ ] Set `NEXT_PUBLIC_SITE_URL` to that exact HTTPS origin for Production and Preview as intended.
- [ ] Confirm `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` point to the intended project.
- [ ] Confirm `SUPABASE_SECRET_KEY` exists only in server environments and is never exposed to browser bundles/logs.
- [ ] Confirm alternate domains redirect permanently to the canonical host.
- [ ] Verify canonical tags, Open Graph URLs, Twitter images, JSON-LD URLs, robots Host, and sitemap URLs all use the canonical host.
- [ ] Verify `/robots.txt`, `/sitemap.xml`, and `/manifest.webmanifest` return 200 and valid content.
- [ ] Verify Google Search Console ownership and submit the correct sitemap.

## Supabase schema and RLS

- [ ] Compare the deployed migration history with migrations 001–019.
- [ ] Confirm every required table, column, index, constraint, trigger, policy, bucket, and RPC exists.
- [ ] Confirm category code selects only deployed category columns.
- [ ] Confirm `admin_users` contains the intended active administrators only.
- [ ] Verify anon users can read active categories/brands/merchants, published products, eligible offers, and published product images only.
- [ ] Verify anon users cannot read inactive/draft/admin-only rows.
- [ ] Verify ordinary authenticated non-admin users cannot write catalog data.
- [ ] Verify active admins can read inactive rows and perform permitted writes.
- [ ] Verify inactive admins lose access immediately.
- [ ] Verify RPC execute grants for product save, offer replacement, image replacement, cleanup, and analytics are least-privilege.
- [ ] Verify product and knowledge-hub storage buckets and object policies.
- [ ] Verify RLS remains enabled and there are no public write policies.

## Authentication and authorization

- [ ] Sign in with a valid active admin and reach `/admin`.
- [ ] Reject an invalid password with a safe message.
- [ ] Redirect an unauthenticated user from every protected admin route to `/admin/login`.
- [ ] Send a valid non-admin user to Access Denied.
- [ ] Distinguish authentication-service outages from permission denial.
- [ ] Verify session refresh and cookie forwarding across navigation and Server Actions.
- [ ] Verify sign-out invalidates access and returns to login.
- [ ] Verify CSRF protections and SameSite/Secure cookie behavior.
- [ ] Verify Supabase rate limiting, password policy, recovery, MFA requirement, and administrator offboarding policy.
- [ ] Verify no key, token, password, cookie, or secret appears in UI or logs.

## Homepage

- [ ] Homepage returns 200 on canonical host.
- [ ] Hero image, copy, and main search/deal CTA load without layout shift.
- [ ] Featured, trending, latest, best-deal, brand, and category sections show correct database-backed data.
- [ ] Empty states differ from temporary query failures.
- [ ] Product prices use eligible fresh offers only.
- [ ] Category and brand counts match public products.
- [ ] Remove the sample market bar or visibly label every value as static with an as-of date.
- [ ] Verify no misleading “live” financial values remain.

## Navigation

- [ ] Every desktop and mobile navigation link returns an intended non-error page.
- [ ] Implement or remove `/wishlist` and `/login` links.
- [ ] Trending navigation displays only trending products.
- [ ] Active-page indicators are correct for query-based search states.
- [ ] Mobile menu opens, traps focus, closes with Escape/backdrop/close button, and restores focus.
- [ ] Category navigation is populated from active Supabase categories only.
- [ ] All Categories opens and is fully keyboard operable.
- [ ] Footer links lead to accurately labeled destinations.
- [ ] External social links use safe new-tab attributes and point to approved accounts.

## Categories

- [ ] Mobiles appears in navigation and `/categories/mobiles`.
- [ ] Inactive or nonexistent categories are absent from public navigation.
- [ ] Unknown category slugs return 404 or an intentional noindex state.
- [ ] Category name, description, products, counts, brand filters, and merchant filters are correct.
- [ ] Category search, price, discount, availability, featured, trending, best-price, and sort filters work.
- [ ] Category pagination exposes all matching products beyond 48/100 rows.
- [ ] Category canonical and structured metadata use the canonical domain.

## Brands

- [ ] Confirm whether public brand index/detail pages are launch scope.
- [ ] Brand filters show active brands only.
- [ ] Brand links return all matching published products.
- [ ] Inactive brands do not appear as public filter options.
- [ ] Footer Brand destination is accurate.
- [ ] Brand logo fallback and broken-image behavior are acceptable.

## Merchants

- [ ] Confirm whether public merchant index/detail pages are launch scope.
- [ ] Merchant filters show active merchants only.
- [ ] Inactive merchants and their offers do not appear publicly or redirect.
- [ ] Merchant website, affiliate network, logo, and tracking configuration are reviewed.
- [ ] Footer Merchant destination is accurate.

## Products and search

- [ ] Search by product name works case-insensitively.
- [ ] Search by brand and merchant works.
- [ ] Category, brand, merchant, price, discount, availability, and best-price filters combine correctly.
- [ ] Invalid URL parameters are safely normalized.
- [ ] Minimum price above maximum price has an understandable outcome.
- [ ] Relevance, price-low, price-high, discount, newest, and popular sorts have distinct verified semantics.
- [ ] Search includes matches beyond the newest 100 products.
- [ ] Accurate total counts and pagination are present.
- [ ] Search filters preserve state across pagination and navigation.
- [ ] Product detail shows correct gallery, descriptions, features, specifications, prices, discount, availability, timestamp, and related products.
- [ ] Products without eligible offers display a clear non-purchasable state.
- [ ] Related products use eligible active offers only.
- [ ] Mixed-currency products are rejected or displayed/structured correctly.
- [ ] Wishlist/compare controls persist as intended or are removed before launch.

## Affiliate links and offer accuracy

- [ ] Every Buy Now link uses `/go/<offer-id>` and opens safely.
- [ ] Redirect accepts only valid UUIDs and HTTP(S) destinations.
- [ ] Redirect requires a published product, active offer, and active merchant.
- [ ] Invalid/inactive offers redirect to `/go/unavailable`.
- [ ] Affiliate links include `sponsored nofollow noopener noreferrer`.
- [ ] Qualified clicks are recorded once with expected source/device fields.
- [ ] Analytics failure does not block a valid redirect but is logged/monitored.
- [ ] Missing `SUPABASE_SECRET_KEY` produces a monitored operational alert.
- [ ] Offer freshness SLA is enforced and stale offers are removed or clearly disclosed.
- [ ] Price, original price, savings, coupon, shipping, availability, and last-checked values match merchant destinations.
- [ ] Legal affiliate disclosure is visible and accurate.

## Admin dashboard

- [ ] All counts match direct database checks.
- [ ] Failed counts display Unavailable rather than zero.
- [ ] Recent products are correctly ordered and linked as intended.
- [ ] Quick actions open the labeled create workflows.
- [ ] Placeholder Import and Settings modules are implemented, removed, or clearly unavailable.
- [ ] Dashboard failures produce safe UI messages and structured server diagnostics.

## Categories CRUD

- [ ] List shows active and inactive categories with correct product counts.
- [ ] Search and status filters work together.
- [ ] Create a category with valid name, slug, description, image URL, and status.
- [ ] Edit every supported category field.
- [ ] Deactivate and reactivate a category.
- [ ] Duplicate name and duplicate slug show specific field errors.
- [ ] Invalid URLs, malformed slugs, blank names, and excessive lengths are rejected.
- [ ] Deactivated categories leave public navigation and new-product options.
- [ ] Category errors log code, message, details, hint, and HTTP status where available.

## Brands CRUD

- [ ] List shows active/inactive brands and correct product counts.
- [ ] Search and status filters work.
- [ ] Create, edit, deactivate, and reactivate a brand.
- [ ] Duplicate name/slug errors are specific.
- [ ] Website and logo URL validation works.
- [ ] Deactivated brands are handled correctly for existing products and new selections.
- [ ] Brand database failures are structured in server logs.

## Merchants CRUD

- [ ] List shows active/inactive merchants and correct offer counts.
- [ ] Search and status filters work.
- [ ] Create, edit, deactivate, and reactivate a merchant.
- [ ] Duplicate name/slug errors are specific.
- [ ] Website, logo, network, and tracking parameter validation works.
- [ ] Deactivating a merchant removes its offers from public display/redirects.
- [ ] Merchant database failures are structured in server logs.

## Products CRUD

- [ ] Product editor loads all active category, brand, and merchant options.
- [ ] Create a draft without offers or images.
- [ ] Create a draft with brand, multiple images, and multiple offers.
- [ ] Publish with each supported eligible availability and valid price combination.
- [ ] Verify one authoritative publication contract across UI and SQL.
- [ ] Reject publication without an active category and eligible fresh active offer.
- [ ] Edit name, slug, description, category, brand, flags, status, images, and offers.
- [ ] Simulate brand/image/offer failure and confirm no partial update persists.
- [ ] Duplicate product slug produces a specific error.
- [ ] Archive is reversible or its intended recovery process is documented.
- [ ] Concurrent edits do not silently overwrite newer data.

## Product offers

- [ ] Create and edit a standalone offer.
- [ ] Create and edit embedded multi-offers from the product form.
- [ ] Enforce one offer per product/merchant.
- [ ] Validate URL, current/original price, currency, availability, coupon, shipping, title, timestamp, and active state.
- [ ] Standardize coupon terminology and 100-character limit.
- [ ] Reject active offers for inactive merchants.
- [ ] Confirm list filters for product, merchant, active state, availability, missing URL, and stale state.
- [ ] Confirm deleting/replacing offers cannot leave a published product without an eligible offer.

## Image uploads

- [ ] Upload genuine JPG, PNG, and WebP images.
- [ ] Reject disguised files, unsupported MIME types, files over 5 MB, and a ninth image.
- [ ] Upload from desktop picker, drag/drop, phone gallery, and rear camera.
- [ ] Crop/rotate/export and verify output dimensions/type/quality.
- [ ] Add and edit external URLs only if the approved security policy permits them.
- [ ] Reorder images and change the primary image with pointer and keyboard controls.
- [ ] Delete one and all images.
- [ ] Verify private uploaded images display publicly only for published products.
- [ ] Verify inactive/draft image objects cannot be fetched anonymously.
- [ ] Simulate failures at upload, image RPC, offer RPC, and product rollback; confirm no orphan objects.
- [ ] Verify image URL dialog traps/restores focus and closes with Escape.
- [ ] Verify direct upload/progress behavior under slow mobile networks.

## Validation and error handling

- [ ] Test blank, boundary-length, malformed, stale-reference, duplicate, and tampered hidden-manifest inputs.
- [ ] Verify server validation does not rely on browser validation.
- [ ] Verify errors attach to the correct field and are announced to assistive technology.
- [ ] Verify Supabase errors log code, message, details, hint, operation, and HTTP status where available.
- [ ] Verify production UI never exposes SQL, keys, tokens, cookies, or secrets.
- [ ] Verify empty states are distinguishable from failed queries.
- [ ] Add and test public/admin error boundaries with recovery actions.
- [ ] Verify cleanup/rollback failures generate alerts for remediation.

## Mobile responsiveness

- [ ] Test 320×568, 360×800, 390×844, 412×915, tablet portrait/landscape, and desktop widths.
- [ ] Verify no unintended horizontal page scrolling.
- [ ] Verify navbar, category scroller, menu, hero, product cards, filters, tables, forms, offer cards, gallery, and dialogs remain usable.
- [ ] Verify sticky headers do not obscure focused controls or anchors.
- [ ] Verify touch targets are at least 44×44 CSS pixels.
- [ ] Verify camera/gallery workflows on iOS Safari and Android Chrome.
- [ ] Verify orientation changes preserve usable state.

## Accessibility

- [ ] Run axe on homepage, search, category, product, login, dashboard, and every CRUD form/state.
- [ ] Complete keyboard-only navigation with visible focus.
- [ ] Verify skip links reach the correct main landmark.
- [ ] Verify one meaningful H1 and logical headings per page.
- [ ] Verify names/labels for all inputs, buttons, menus, dialogs, images, tables, and status messages.
- [ ] Verify errors use appropriate alert/live-region behavior without duplicate announcements.
- [ ] Verify native/custom dialogs trap and restore focus and close with Escape.
- [ ] Verify color contrast in default, hover, focus, disabled, success, warning, and error states.
- [ ] Verify 200% zoom and text spacing without loss of functionality.
- [ ] Verify reduced-motion preference stops/avoids unnecessary rotation and animation.
- [ ] Test VoiceOver/Safari and NVDA/Chrome critical workflows.

## SEO

- [ ] Verify unique titles/descriptions/canonicals for homepage, category, product, search, guides, and company pages.
- [ ] Verify filtered search pages are noindex as intended.
- [ ] Verify unknown/inactive/empty registry categories are 404 or noindex.
- [ ] Validate Organization, Website, Product, AggregateOffer, Offer, and Breadcrumb JSON-LD.
- [ ] Map pre-order/limited/out-of-stock availability correctly in structured data.
- [ ] Ensure structured offer currency and destinations are accurate.
- [ ] Ensure sitemap contains only canonical, indexable, active/published URLs.
- [ ] Confirm admin and affiliate redirect routes remain excluded from crawling.
- [ ] Check social preview images and favicon/apple icon rendering.

## Performance and reliability

- [ ] Capture Lighthouse/Core Web Vitals on homepage, search, category, and product pages on mobile and desktop.
- [ ] Set launch budgets for LCP, INP, CLS, JavaScript, images, and server response time.
- [ ] Replace in-memory filtering with indexed database pagination.
- [ ] Validate Supabase indexes against final search/filter/sort queries.
- [ ] Load-test homepage parallel queries and search traffic.
- [ ] Verify external images cannot degrade or track visitors unexpectedly.
- [ ] Replace 42 MB Server Action uploads with signed direct uploads or validate serverless limits under worst-case load.
- [ ] Verify cache/revalidation behavior immediately after all CRUD changes.
- [ ] Verify graceful behavior during Supabase, Storage, and analytics outages.

## Final launch sign-off

- [ ] All Critical defects closed.
- [ ] All High defects closed or formally accepted by product/security/operations owners.
- [ ] All mandatory manual checks have recorded evidence.
- [ ] Production smoke test passed after deployment.
- [ ] Supabase migration/RLS verification passed after deployment.
- [ ] Canonical domain and SEO verification passed after deployment.
- [ ] Monitoring shows no elevated errors, failed redirects, or storage cleanup problems.
- [ ] Rollback has been rehearsed and release owner approves launch.
