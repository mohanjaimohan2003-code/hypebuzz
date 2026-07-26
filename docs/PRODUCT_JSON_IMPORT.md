# HypeBuzz Product JSON Import

## How it works

The Add Product page contains a collapsed **AI Product Import** panel. Despite the heading, this is a local JSON importer and does not call an AI service.

1. Open the panel and paste one product JSON object, or select **Load Example**.
2. Select **Auto Fill Product** to parse, normalize, validate, and preview the data.
3. Review the compact preview, record matches, and warnings.
4. Select **Apply to Form**. No Supabase request or save occurs.
5. Review the populated Add Product form, upload images manually, and use the existing Create Product button to save a draft or publish.

**Clear Import** clears only the textarea, preview, validation error, warnings, and importer success state. It does not reset the product form or remove images.

## Canonical example

```json
{
  "productName": "ASIAN Boss-25 Men's Running, Walking & Training Shoes",
  "slug": "asian-boss-25-mens-running-walking-training-shoes-off-white-brown",
  "brand": "ASIAN",
  "category": "Sports Shoes",
  "subcategory": "Men's Sports Shoes",
  "shortDescription": "Lightweight men's sports shoes with soft cushioning and a flexible sole.",
  "description": "A detailed original product description.",
  "highlights": ["Lightweight construction", "Soft cushioning", "Flexible sole"],
  "specifications": {
    "Brand": "ASIAN",
    "Model": "Boss-25",
    "Colour": "Off White Brown"
  },
  "merchant": "Amazon",
  "affiliateUrl": "https://link.amazon/example",
  "currentPrice": 899,
  "originalPrice": 1999,
  "currency": "INR",
  "stockStatus": "in_stock",
  "activeOffer": true,
  "offerLabel": "Limited Time Deal",
  "discountPercentage": 55,
  "featuredProduct": false,
  "trendingProduct": true,
  "status": "draft",
  "seoTitle": "ASIAN Boss-25 Men's Running Shoes",
  "seoDescription": "Discover ASIAN Boss-25 lightweight running shoes.",
  "searchTags": ["men's running shoes", "walking shoes"],
  "pros": ["Lightweight", "Comfortable cushioning"],
  "considerations": ["Check the size chart before ordering"],
  "faq": [{
    "question": "Are these suitable for walking?",
    "answer": "They are designed for walking, running and training."
  }]
}
```

The same example is available from the UI.

## Required and optional fields

Import parsing is intentionally partial: no field is required merely to preview JSON. `productName` must be non-empty text when supplied. The existing server-side Add Product validation remains authoritative when the administrator finally saves.

Currently applied to the form:

- product name and normalized/generated slug;
- short description;
- detailed description, highlights, specifications, SEO title, and SEO description;
- matched category and brand;
- featured/trending flags;
- draft/published selection;
- matched merchant, affiliate URL, current/original price, currency, stock status, active flag, and offer label.

Validated and previewed but not currently applied:

- subcategory;
- search tags;
- pros, considerations, and FAQ;
- discount percentage, which is informational because the application calculates discounts from prices.

Detailed description, highlights, specifications, SEO title, and SEO description are applied to the form after preview confirmation. They are persisted only when the administrator later submits the product form. Migration `021_add_rich_product_fields.sql` must be reviewed and applied before these fields are used against a deployed database. Search tags, pros, considerations, FAQ, and subcategory remain intentionally unsupported and produce warnings.

## Accepted aliases

| Canonical | Aliases |
|---|---|
| `productName` | `name`, `title`, `product_name` |
| `shortDescription` | `short_description` |
| `description` | `longDescription`, `detailedDescription` |
| `currentPrice` | `price`, `salePrice` |
| `originalPrice` | `mrp`, `original_price` |
| `affiliateUrl` | `affiliate_link`, `productUrl` |
| `featuredProduct` | `isFeatured` |
| `trendingProduct` | `isTrending` |
| `stockStatus` | `stock` |

Alias handling is centralized in `lib/admin/product-import/normalize.ts`.

## Category, brand, and merchant matching

Only records already loaded for the Add Product page are considered. Matching stops at the first stage that produces exactly one record:

1. exact slug, case-insensitive;
2. exact name, case-insensitive;
3. normalized name or slug, with trimmed/lowercase text and hyphens/repeated spaces treated consistently.

No database record is created. A missing or ambiguous explicit reference leaves the corresponding select unselected and produces a warning. Categories loaded by this page are active categories; brands and merchants retain their active state.

## Slugs, prices, booleans, status, and stock

- Slugs are converted to lowercase kebab-case. A warning shows when a supplied slug changes. Missing slugs are generated from product name.
- Prices accept numbers and formatted strings such as `₹899`, `1,999`, and `₹1,999.00`.
- A discount is calculated only when both prices are positive and original price exceeds current price.
- Currency is uppercased and must contain three letters. Missing currency does not overwrite the existing form default, which is INR for a new offer.
- Booleans accept booleans, `"true"`/`"false"`, `"yes"`/`"no"`, and `1`/`0`.
- Missing/invalid status imports as draft. `inactive` maps to draft because the form supports draft and published. Imported `published` only selects the form option; the administrator must still press the final save button.
- Stock aliases map to schema values: available/in stock → `in_stock`; unavailable/out of stock → `out_of_stock`; preorder/pre-order → `pre_order`; limited → `limited_stock`.

## Arrays and objects

- Highlights are applied after trimming empty values and exact duplicates; at most 12 are saved. Pros, considerations, and search tags remain preview-only.
- Specifications accept a plain key-value object. Primitive values become readable strings, labels are preserved, unsafe keys are rejected, and at most 30 rows are saved.
- FAQ accepts question/answer objects. Incomplete entries are ignored with a warning without failing the import.

## Safety behavior

- Input is parsed only with `JSON.parse`; no evaluation or execution occurs.
- Input is limited to 100 KB.
- The root must be one object.
- `__proto__`, `prototype`, and `constructor` keys are rejected recursively.
- Imported text is assigned to ordinary text inputs/textarea values and is not rendered as HTML.
- URLs must be HTTP(S) and at most 2,048 characters.
- The importer runs locally in the admin browser, makes no database call, logs no JSON or affiliate URL, and has no access to the Supabase secret client.
- Invalid fields are ignored independently; other valid fields remain available for review.

## Image workflow

Remote image fields are not imported. Existing Choose Images, Use Camera, previews, editing, ordering, primary-image selection, and deletion remain unchanged. Applying or clearing an import never touches the image component. Upload images manually before final approval according to the existing product rules.

## Common errors

- **Invalid JSON. Check commas, quotation marks and brackets.** Fix JSON syntax.
- **Product JSON must be 100 KB or smaller.** Reduce the pasted object.
- **Product JSON contains a forbidden object key.** Remove prototype-related keys.
- **Product Name must be text.** Supply a JSON string.
- **Current Price must be a valid non-negative number.** Use a number or supported formatted numeric string.
- **The affiliate URL is not valid.** Supply a complete HTTP(S) URL.
- **Category/Brand/Merchant was not found.** Create the record first or select an existing option manually.
- **Some fields could not be imported.** Review the warning list; valid fields can still be applied.

## Manual verification still required

Use an authenticated admin session to test the Add Product page at mobile and desktop widths, confirm focus/scroll behavior, verify selected files survive preview/apply/clear, and complete draft/published saves against a reconciled staging database.
