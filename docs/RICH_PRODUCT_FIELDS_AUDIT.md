# Rich Product Fields Audit

Date: 2026-07-26  
Scope: long description, highlights, specifications, SEO title, SEO description, and derived discount percentage.

## Current state

| Logical field | Repository database state | Application state before this change |
|---|---|---|
| Long description | Already present as nullable `products.description text` in migration 001 | Public query/page already read and rendered it, but admin form, editor query, and save RPC did not write it |
| Specifications | Already present as non-null `products.specifications jsonb default '{}'`, constrained to a JSON object | Public query converted primitive object entries to a definition list; admin form/editor/save path did not write it |
| Highlights | No dedicated column. Public reader treated a legacy `specifications.features` array as features | Importer validated highlights but warned they were unsupported |
| SEO title | Missing from `products` | Metadata always generated `${product.name} prices and offers` |
| SEO description | Missing from `products` | Metadata used short description, then long description, then a generated sentence |
| Discount percentage | Not stored | Correctly derived from current/original offer prices in shared price helpers |

## Actual product and offer schema

`products` currently contains identity/name/slug, Amazon ASIN, short and long descriptions, category/brand references, primary image URL, `specifications`, publication status/flags, and timestamps. `product_offers` contains merchant/link/prices/currency/availability, optional offer copy, activity/freshness, and timestamps. Discount is offer-specific and therefore does not belong on `products`.

## Minimum schema change

Only three columns are required:

- `products.highlights jsonb not null default '[]'::jsonb`
- `products.seo_title text null`
- `products.seo_description text null`

Add a JSON-array check for highlights and defensive length checks for SEO fields. Do not add `long_description`, a second specifications column, or `discount_percentage`.

The forward migration must be applied only after Phase 1 production reconciliation confirms the actual production `products` schema. Existing rows remain valid through defaults and nullable SEO fields. No data backfill or rewrite is required. The application reader should retain a compatibility fallback for legacy `specifications.features` values.

## Code requiring updates

- `lib/types/database.ts`: product row fields.
- `lib/validation/product.ts`: parse and validate plain description, highlight manifest, specification manifest, and SEO copy.
- `components/admin/product-form.tsx`: controlled rich-field state, mobile-friendly inputs, importer application.
- New reusable highlight/specification field components.
- `app/admin/(protected)/products/actions.ts`: pass fields through create/update persistence.
- `lib/data/admin-products.ts` and edit page: fetch/map rich fields.
- `supabase/migrations/020_unify_product_publication_contract.sql`: remains historical/proposed and is not edited.
- New migration 021: add only the missing columns and defensive constraints. The legacy RPC remains unchanged; the current Server Action performs the rich-field update separately pending Phase 2B.
- `lib/data/public-product.ts`: select/normalize fields and expose SEO values.
- `app/products/[slug]/page.tsx`: display order and metadata fallbacks.
- Product importer application/warnings/tests and documentation.

## RLS implications

No new policy is required. Existing policies operate at row level:

- public users may select published product rows;
- active admins may read all products and insert/update products;
- no public write grant is introduced.

Adding columns changes which data is visible on an already-readable published row, so administrators must treat SEO and description fields as public content. No secrets or private notes belong in these columns.

## Rollback considerations

- Application rollback is safe while columns remain present; older code ignores them.
- Do not drop the columns during an emergency rollback because deployed/newer application versions may still select them.
- Removing columns would be destructive and requires a later, separately reviewed migration after proving no usage.
- No existing product data is rewritten, and legacy `specifications.features` remains readable.
