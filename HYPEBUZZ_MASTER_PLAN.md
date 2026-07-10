# HypeBuzz Master Plan

**Document status:** Draft v1  
**Last updated:** 10 July 2026  
**Current product stage:** Initial scaffold / pre-MVP

## 1. Executive summary

HypeBuzz is a discovery platform for trending products, worthwhile deals, and useful recommendations. The first release should help a visitor quickly answer three questions:

1. What products are gaining attention right now?
2. Is the attention supported by credible signals and a genuinely good offer?
3. Where can I safely buy or learn more?

The MVP is a curated discovery experience, not a full marketplace. HypeBuzz will normalize product and offer data, add editorial context and transparent trend signals, then send users to merchants through clearly disclosed outbound links. This keeps the initial scope focused while establishing the data and trust foundations needed for personalization, community features, and automated trend detection later.

## 2. Current baseline

The repository currently contains:

- Next.js 16.2.10 with the App Router
- React 19.2.4 and TypeScript
- Tailwind CSS 4
- A single static home page with a headline and “Explore Products” button
- Default application metadata and no product data, authentication, database, tests, analytics, or deployment configuration

The current home-page rocket emoji appears to have a text-encoding issue. This and the default metadata should be corrected in the first implementation slice.

## 3. Product vision and principles

### Vision

Become the most useful place to understand what is trending, why it is trending, and whether it is worth buying.

### Product principles

- **Trust before clicks:** show evidence, timestamps, sources, price history, and affiliate disclosures.
- **Signal over noise:** rank by meaningful momentum and value rather than raw popularity alone.
- **Fast discovery:** users should reach a relevant product or deal within two interactions.
- **Editorial accountability:** automation proposes; a human can review, correct, feature, or suppress.
- **Mobile first:** discovery, comparison, and outbound purchase flows must work exceptionally well on phones.
- **Accessible by default:** target WCAG 2.2 AA, keyboard operation, clear focus states, and reduced-motion support.
- **Measure outcomes:** every major feature needs a success metric and observable events.

## 4. Target users and jobs

### Primary users

- **Trend explorer:** wants a quick, entertaining view of products gaining attention.
- **Value seeker:** wants verified discounts and price context before buying.
- **Intent-driven shopper:** wants recommendations within a category, use case, or budget.

### Secondary users

- **Editor/curator:** reviews products and deals, manages collections, and corrects bad data.
- **Merchant or affiliate partner:** supplies offers and needs accurate attribution.

### Core jobs to be done

- “Show me what is trending without making me sift through spam.”
- “Tell me whether this deal is actually good.”
- “Help me compare a small number of sensible choices.”
- “Explain why you recommend this product and how current the information is.”

## 5. Scope

### MVP: must have

- Responsive marketing/discovery home page
- Trending product feed with category filters
- Product detail pages with summary, key facts, trend explanation, offers, and disclosure
- Deals index with current price, previous/reference price, discount, merchant, and verification time
- Search by product, brand, and category
- Curated collections/recommendations
- Admin/editor workflow for products, offers, categories, collections, and publishing status
- SEO metadata, canonical URLs, sitemap, robots rules, and social preview images
- Analytics, error monitoring, structured logs, and basic operational dashboards
- Legal pages: privacy, terms, affiliate disclosure, and editorial methodology

### Post-MVP

- Accounts, saved products, followed categories, and alerts
- Personalized feed and onboarding preferences
- Product comparisons
- User voting, reviews, comments, and moderation
- Automated ingestion from merchant feeds and external trend sources
- Newsletter and push notifications
- Merchant portal and sponsored placements
- Native mobile applications

### Explicitly out of scope for MVP

- HypeBuzz-operated checkout, inventory, fulfillment, or refunds
- Open user-generated content
- Fully autonomous publishing from untrusted sources
- Scraping sites without confirmed contractual and legal permission
- Claims that a product is “best” without a documented methodology

## 6. MVP experience

### Information architecture

```text
/
├── /trending
│   └── /trending/[category]
├── /deals
├── /products/[slug]
├── /collections/[slug]
├── /search?q=
├── /about
├── /methodology
├── /affiliate-disclosure
├── /privacy
└── /terms

/admin (authenticated and role protected)
├── /products
├── /offers
├── /collections
└── /review-queue
```

### Home page

- Header with logo, primary navigation, search, and optional account entry point
- Hero with a concrete value proposition and direct discovery CTA
- “Trending now” product rail/grid
- Verified deals section
- Category shortcuts
- One or more editorial collections
- Trust/methodology explainer and affiliate disclosure
- Newsletter capture only after consent, delivery, and unsubscribe flows are ready

### Product page

- Product identity: title, brand, category, imagery, and concise verdict
- Trend score and plain-language explanation of the contributing signals
- Key features, strengths, limitations, and intended audience
- Offer cards with price, merchant, availability, last verification time, and outbound CTA
- Price context/history when reliable data exists
- Related products and collections
- Source, correction, and affiliate disclosures

### Empty, loading, and failure states

Every data-backed route must define useful loading skeletons, empty states with recovery actions, not-found behavior, and retry-safe error states. A failed merchant or analytics integration must not prevent core product content from rendering.

## 7. Content and ranking model

### Proposed trend score

Start with an explainable weighted score rather than opaque machine learning:

```text
trend_score =
  0.30 × normalized_velocity
  + 0.25 × normalized_search_interest
  + 0.20 × normalized_social_mentions
  + 0.15 × normalized_editorial_signal
  + 0.10 × normalized_deal_quality
  - confidence_penalties
```

Weights are an initial hypothesis. Store the score version, inputs, observation window, confidence, and calculation time so rankings can be audited and reproduced. Never present inferred popularity as sales volume.

### Deal quality

A deal should be publishable only when the merchant is approved, the destination works, the product match is sufficiently confident, the price is current, and any reference-price claim is supported. Show “last checked” timestamps. Automatically expire stale offers and never fabricate crossed-out prices.

### Editorial states

Use `draft → in_review → published → archived`, with a separate suppression mechanism for safety, legal, quality, or merchant issues. Record who changed publication state and when.

## 8. Data model

The initial relational model should include:

| Entity | Key fields |
|---|---|
| Product | id, slug, name, brand_id, category_id, summary, status, image data, specs, timestamps |
| Brand | id, slug, name, website, status |
| Category | id, slug, name, parent_id, description |
| Merchant | id, name, domain, affiliate settings, approval status |
| Offer | id, product_id, merchant_id, URL, currency, current/reference price, availability, verified_at, expires_at |
| Trend snapshot | product_id, score, score_version, signal inputs, confidence, window, calculated_at |
| Collection | id, slug, title, description, status, published_at |
| Collection item | collection_id, product_id, position, editorial note |
| Source record | product_id, source type, source URL/ref, observed_at, metadata |
| User | id, identity provider id, role, consent fields, timestamps |
| Saved item | user_id, product_id, created_at |
| Audit event | actor, action, entity type/id, before/after summary, timestamp |

Use decimal monetary fields plus ISO 4217 currency codes; never store money as floating-point values. Use stable internal IDs and unique, redirect-aware slugs.

## 9. Technical architecture

### Application approach

- Keep pages, layouts, and data-heavy components as Server Components by default.
- Add Client Components only at narrow interactive boundaries such as search input, filters, save controls, and analytics consent.
- Fetch databases and trusted upstream APIs from server-only modules so credentials and query logic never enter the browser bundle.
- Start independent data requests in parallel and use Suspense boundaries with meaningful skeletons for slower sections.
- Treat caching as a per-data-source decision. Product editorial content can be cached longer; price and availability require short lifetimes and explicit invalidation after updates.
- Use Route Handlers for deliberate HTTP endpoints such as webhooks or public APIs, not as an unnecessary hop between Server Components and the database.
- Validate all untrusted input at the server boundary and authorize every mutation independently of UI visibility.

### Proposed project structure

```text
app/
├── (site)/
├── admin/
├── api/
├── globals.css
└── layout.tsx
components/
├── ui/
├── product/
├── deal/
└── layout/
lib/
├── data/
├── domain/
├── validation/
├── auth/
├── analytics/
└── observability/
```

Route-specific components should remain colocated with their route until they are genuinely shared. Prefer typed domain functions over embedding business rules directly in pages.

### Infrastructure decisions to confirm before Phase 2

- Managed relational database and ORM/query layer
- Authentication provider and role model
- Image asset source, transformation, and moderation policy
- Search implementation: database full-text initially versus hosted search
- Analytics, error monitoring, email, and feature-flag providers
- Hosting region, primary audience geography, currency, and localization strategy

Choose providers through short decision records based on cost, regional availability, data ownership, exportability, security, and operational burden.

## 10. Security, privacy, and trust

- Maintain separate development, preview, and production environments and secrets.
- Never expose credentials through `NEXT_PUBLIC_` variables; mark sensitive modules server-only.
- Enforce least-privilege roles such as viewer, editor, publisher, and admin.
- Require server-side authentication and authorization on every admin read and mutation.
- Validate URLs, payload size, file types, and structured inputs; rate-limit abuse-sensitive endpoints.
- Use secure cookies, CSRF-safe mutation patterns, restrictive security headers, and a practical Content Security Policy.
- Minimize personal data, document retention periods, support deletion/export obligations, and gate nonessential tracking on consent where required.
- Sanitize or safely render any rich text; do not accept arbitrary HTML from editors or feeds.
- Log administrative changes without putting secrets or unnecessary personal data in logs.
- Establish a correction, takedown, vulnerability-reporting, and incident-response process before launch.

## 11. SEO, performance, and accessibility

### SEO

- Unique titles and descriptions for every indexable route
- Product and collection canonical URLs
- Product/Breadcrumb structured data only when it accurately reflects visible content
- Dynamic sitemap and intentional robots directives
- Open Graph and social preview images
- Redirects for changed slugs and no indexing of thin search/filter combinations

### Performance budgets

- Meet Core Web Vitals at the 75th percentile on representative mobile traffic
- LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1
- Keep home-page client JavaScript below an initial 150 KB gzip target, reviewed as features land
- Optimize and size all images, reserve layout space, and prioritize only the true LCP image
- Avoid third-party scripts until their value and performance/privacy cost are measured

### Accessibility acceptance

- Semantic landmarks and heading hierarchy
- Full keyboard use with visible focus
- Text and controls meeting contrast requirements
- Accessible names and error descriptions on controls
- Alt text based on image purpose
- Motion that respects user preferences
- Automated checks plus manual keyboard and screen-reader smoke testing

## 12. Analytics and success metrics

### North-star metric

**Qualified discovery sessions:** sessions in which a user views at least one product detail and then saves, compares, subscribes, or follows a verified merchant link.

### Supporting metrics

- Product-detail view rate from discovery surfaces
- Search success rate and zero-result rate
- Outbound click-through rate, segmented by placement and merchant
- Save/follow rate after accounts launch
- Return visitor rate
- Offer freshness and broken-link rate
- Trend ranking click distribution and editorial override rate
- Core Web Vitals, error-free sessions, and API/data-source reliability

Define an event dictionary before implementation. Events should describe user intent, avoid unnecessary personal data, include placement and entity identifiers, and be validated in preview before production.

## 13. Delivery roadmap

### Phase 0 — Foundation and decisions (2–3 days)

- Confirm audience geography, initial categories, business model, and brand direction
- Write provider decision records
- Establish formatting, type-checking, test commands, environment validation, and CI
- Define design tokens and reusable primitives
- Replace default metadata and repair encoding issues

**Exit:** clean CI, documented decisions, responsive shell, and approved MVP scope.

### Phase 1 — Clickable discovery prototype (3–5 days)

- Build the polished home page, navigation, footer, trend cards, deal cards, and collection cards
- Use typed fixture data with realistic states
- Add responsive, accessibility, metadata, loading, empty, and error behavior
- Instrument the first analytics events behind a consent-aware boundary

**Exit:** stakeholder-approved experience with no backend dependency.

### Phase 2 — Content platform (1–2 weeks)

- Add database schema, migrations, seed data, and typed server-side repository functions
- Implement product, category, collection, and deal routes
- Add search and filter URLs with shareable state
- Add admin authentication, role checks, edit forms, review flow, and audit events
- Implement caching and invalidation rules per entity

**Exit:** editors can publish complete product discovery content without code changes.

### Phase 3 — Trust and trend engine (1–2 weeks)

- Add source records, offer verification/expiry, broken-link checks, and freshness indicators
- Implement versioned trend-score calculation and a review queue
- Add methodology, disclosures, legal pages, structured data, sitemap, and corrections flow
- Add scheduled jobs with idempotency, retries, timeouts, and failure alerts

**Exit:** every published trend and deal is traceable, explainable, and operationally monitored.

### Phase 4 — Production hardening and launch (1 week)

- Add unit, integration, and end-to-end coverage for critical journeys
- Run accessibility, security, performance, and SEO audits
- Configure preview/production environments, backups, alerts, dashboards, and runbooks
- Seed launch content and perform editorial QA
- Soft launch, observe real usage, fix high-impact issues, then expand traffic

**Exit:** all launch gates below are satisfied and rollback is rehearsed.

### Phase 5 — Retention and learning (post-launch)

- Analyze discovery quality and ranking behavior
- Add accounts, saves, follows, alerts, and personalization only after validating demand
- Experiment with comparison, newsletters, and additional acquisition surfaces
- Automate ingestion incrementally, retaining human review for low-confidence items

## 14. Testing strategy

- **Static checks:** TypeScript, ESLint, formatting, dependency/security review
- **Unit tests:** score calculation, price/discount math, validation, slugging, expiry, and permissions
- **Integration tests:** repositories, mutations, caching/invalidation, jobs, and webhook verification
- **End-to-end tests:** browse → filter/search → product → outbound click; admin sign-in → edit → publish; failure and unauthorized paths
- **Accessibility:** automated scans plus manual keyboard/screen-reader checks
- **Visual regression:** key routes at common mobile and desktop sizes
- **Production smoke tests:** health, representative routes, outbound links, analytics, and scheduled jobs

Use deterministic fixtures. Never call live merchant services from the normal test suite.

## 15. Definition of done

A feature is done when:

- Acceptance criteria and edge cases are implemented
- Loading, empty, error, unauthorized, and mobile states are handled where applicable
- Types, lint, relevant tests, and production build pass
- Accessibility and keyboard behavior are checked
- Analytics and observability are included or explicitly deemed unnecessary
- Security, privacy, caching, SEO, and performance effects are reviewed
- User-facing copy and disclosures are approved
- Documentation and operational notes are updated

## 16. Launch gates

- No open critical/high security issues
- Critical end-to-end journeys pass in the production-like environment
- No known broken product or affiliate links in launch content
- Backup/restore, rollback, error alerting, and on-call ownership are verified
- Legal, privacy, methodology, and affiliate disclosures are published
- Admin routes deny unauthenticated and unauthorized requests server-side
- Representative pages meet accessibility and performance targets
- Analytics events are accurate and do not collect prohibited data
- Content owners have approved the launch catalog and freshness policy

## 17. Key risks and mitigations

| Risk | Mitigation |
|---|---|
| Unreliable or stale offer data | Verification timestamps, automatic expiry, monitoring, and merchant fallbacks |
| Misleading trend claims | Versioned methodology, source provenance, confidence levels, and editorial review |
| Affiliate incentives reduce trust | Prominent disclosure and ranking rules independent of commission |
| Ingestion complexity delays launch | Begin with curated data and automate one trusted source at a time |
| Excessive client JavaScript | Server Components by default and narrow interactive islands |
| Thin pages harm search quality | Index only complete editorial pages and control filter/search indexing |
| Admin compromise | Least privilege, strong authentication, audited mutations, and rate limiting |
| Premature feature sprawl | Enforce MVP scope and require evidence for post-MVP work |

## 18. Immediate implementation backlog

1. Confirm initial market, categories, revenue model, and whether “recommendations” are editorial or personalized.
2. Repair the home-page text encoding and replace default metadata.
3. Establish brand tokens, page container, typography, buttons, cards, header, and footer.
4. Define TypeScript fixture types for product, offer, category, trend snapshot, and collection.
5. Build the Phase 1 home page from fixtures with responsive and accessible states.
6. Add product and collection prototype routes.
7. Add CI checks for lint, type checking, tests, and production build.
8. Write provider decision records before adding a database or authentication dependency.
9. Define the analytics event dictionary and content/trend methodology.
10. Review the prototype and lock Phase 2 acceptance criteria.

## 19. Open decisions

- Which country/region, language, and currency launch first?
- Which three to five product categories are in the first catalog?
- Is monetization affiliate-only initially, and which merchants are approved?
- Will content be entirely editorial at launch, or imported from licensed feeds?
- What source signals are legally and technically available for trend scoring?
- Who may publish, and is four-eyes approval required?
- Are accounts needed for MVP, or can retention wait until behavior validates demand?
- What brand voice and visual direction should distinguish HypeBuzz from deal aggregators?

These decisions should be resolved before building the persistent data layer because they materially affect schema, compliance, ranking, and content operations.
