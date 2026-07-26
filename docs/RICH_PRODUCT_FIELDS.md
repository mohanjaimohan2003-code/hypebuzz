# Rich product fields

## Database model

The product model reuses `products.description` for Long Description and `products.specifications` for Specifications. Proposed migration `021_add_rich_product_fields.sql` adds only `highlights jsonb not null default '[]'`, `seo_title text`, and `seo_description text`.

The migration adds JSON-shape and conservative length checks. It changes no records, policies, grants, functions, or RLS settings. It must not be applied until production schema verification and reconciliation are complete.

Discount percentage is not stored. It is derived as `round(((originalPrice - currentPrice) / originalPrice) * 100)` only when both prices are positive and original price exceeds current price.

## Admin usage and validation

- Long Description is optional plain text, limited to 10,000 characters.
- Highlights are trimmed; empty and exact duplicate entries are removed; at most 12 are accepted.
- Specifications are label/value rows. Empty rows are omitted. Case-insensitive duplicate labels, unsafe keys (`__proto__`, `prototype`, `constructor`), and more than 30 rows are rejected.
- SEO Title and SEO Description are optional. The UI shows 50–60 and 150–160 character recommendations without hard-failing on those recommendations. Database-safe limits are 200 and 500 characters.

All values are validated by the Server Action. Rich data is persisted after the existing product save RPC. This remains in the known non-atomic legacy save path; Phase 2B owns its transactional redesign.

## JSON importer

```json
{
  "description": "Detailed plain-text product information.",
  "highlights": ["Lightweight", "Flexible sole"],
  "specifications": { "Colour": "Blue", "Weight": "1 kg" },
  "seoTitle": "Example product title",
  "seoDescription": "A concise search-result description."
}
```

`longDescription` and `detailedDescription` remain aliases of `description`. Missing properties preserve form values. Invalid optional properties produce warnings; import does not save, publish, or alter uploaded images.

## Public display and SEO

Sections render only when populated. Highlights appear below the short description. Long Description is plain text and Specifications use a responsive definition list. Imported HTML is never interpreted.

Metadata uses SEO overrides when present. Title fallback uses product name plus brand; description fallback uses short description, then long description, then a generated sentence. Affiliate URLs are excluded.

## Deployment and rollback

1. Complete production reconciliation review.
2. Review migration 021 against the verified `products` table.
3. Apply to staging and test create/edit/import/public metadata.
4. Apply the reviewed migration to production before deploying code that selects the new columns.

For rollback, deploy the previous application first. Added columns may remain unused. Destructive column removal is intentionally omitted.
