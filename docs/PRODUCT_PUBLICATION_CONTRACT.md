# HypeBuzz Product Publication Contract

Date: 2026-07-26  
Status: Implemented in repository; pending database and manual verification  
Production reconciliation: **Pending final production verification before launch**

## Authoritative source

The application source of truth is `lib/offers/publication-contract.ts`. Database enforcement is specified by proposed forward migration `020_unify_product_publication_contract.sql`, which must not be applied until production migrations 016 and 019 are verified.

“Stored offer validity” and “publication eligibility” are deliberately different concepts. An out-of-stock offer can be valid data without being eligible to keep a product published.

## Previous rule comparison

| Layer | Draft | Published/category | Offer/merchant | Price/original | Availability | URL/currency | Freshness/public behavior |
|---|---|---|---|---|---|---|---|
| Product form validation | No offer required | Required an active-looking offer; category activity deferred to action | Did not know merchant activity | Current positive; original optional and `>=` current | Eligible: in-stock, limited, pre-order | HTTP(S), 3 uppercase letters | Valid date only; no freshness cutoff |
| Standalone offer validation | Complete offer required when one is saved | Did not inspect product publication state | Action rejected active offer on inactive merchant | Same price intent | Five states accepted | Same intent, but duplicate coupon limits existed | Date syntactic only |
| Product Server Action | Used 016 save RPC, then replaced offers | Re-read active category | Re-read active merchants only during later offer sync | Passed form values | Picked first active offer, which might be out of stock | Relied on form/RPC | No freshness cutoff |
| Offer Server Action | N/A | Deferred published-product safety to trigger | Re-read product and merchant; active offer requires active merchant | Passed validated values | Five states | Passed validated values | No freshness cutoff |
| Migration 016 readiness | Draft exempt | Active category and an offer | Active offer + active merchant | Required original price, `>=` current | Did not restrict availability in final assertion | HTTP(S); omitted currency check in assertion | No freshness rule |
| Migration 016 save RPC | Draft could omit offer | Active category + complete active first offer | Required active merchant even for supplied inactive offer | Required original price for publish | Allowed in-stock, limited, **out-of-stock**; no pre-order | HTTP(S), currency pattern | No freshness rule |
| Migration 019 readiness | Draft exempt | Active category + eligible offer | Active offer + active merchant | Original optional, `>=` current if present | Eligible: in-stock, limited, pre-order | HTTP(S), but currency omitted in assertion | No freshness rule |
| Migration 019 replacement RPC | Replaced full list | Deferred readiness trigger | Did not explicitly reject active offer on inactive merchant | Original optional, `>=` current | Five states | HTTP(S), currency pattern | Stores nullable `last_checked_at` |
| Public product detail | Published product RLS only | Relied on RLS | RLS hid inactive offers/merchants | Lowest price used partial test | Priced in-stock/limited/pre-order; still displayed other offers | Did not validate URL/currency/original for eligibility | Displayed checked date or unavailable |
| Search/category/homepage | Published status only | Relied on RLS | Relied on nested RLS | Positive-price assumptions varied | Eligible availability set only | Did not validate full offer | No freshness rule |
| Structured data | Published page | N/A | N/A | Emitted displayed offer prices | Limited stock became InStock; pre-order became OutOfStock | Currency passed through | No freshness rule |

## 1. Draft product rules

A draft:

- may have no offers and no images;
- may omit optional public copy, brand, specifications, and original price;
- must have a valid name, slug, existing category reference, and valid optional brand reference;
- may reference an inactive category;
- may contain zero or more offers, but every stored offer must satisfy the stored-offer shape below;
- cannot bypass authentication, admin authorization, foreign keys, constraints, or RLS.

An archived product follows the draft publication exemption but remains read-only through the current product form.

## 2. Published product rules

A published product must:

- satisfy all basic product validation;
- reference an existing active category;
- have at least one publication-eligible offer;
- remain ready after product, category, merchant, or offer changes. Deferred database triggers are the final invariant;
- not require a brand, image, long description, short description, or specifications under the current product scope.

The minimum public fields are product ID, valid name and slug, active category, and at least one eligible offer. Images and editorial copy improve quality but are not publication blockers in Phase 2A.

## 3. Stored and eligible offer rules

Every stored offer requires:

- an existing product and merchant;
- a complete HTTP(S) affiliate URL no longer than 2,048 characters;
- a finite current price greater than zero;
- an optional original price which, when supplied, is greater than zero and at least the current price;
- a three-letter uppercase currency code;
- one supported availability value;
- a non-null active flag;
- optional offer title up to 160 characters, coupon code up to 100, shipping note up to 300, and a parseable optional checked timestamp.

A publication-eligible offer additionally requires:

- `is_active = true`;
- an active merchant;
- availability of `in_stock`, `limited_stock`, or `pre_order`.

## 4. Supported availability values

| Value | May be stored/displayed | Supports publication | Meaning |
|---|---:|---:|---|
| `in_stock` | Yes | Yes | Purchasable now |
| `limited_stock` | Yes | Yes | Purchasable now with constrained stock |
| `pre_order` | Yes | Yes | Merchant accepts an order for future fulfillment |
| `out_of_stock` | Yes | No | Informational comparison row; no current purchase availability |
| `unknown` | Yes | No | Availability is not confirmed |

`limited_stock` and `pre_order` are eligible because both represent a current merchant purchase action and the UI labels them explicitly. `out_of_stock` and `unknown` remain visible only as supplemental offers on a product supported by another eligible offer. A product with only those states must not remain published.

## 5. Price rules

- Current price is always required and must be greater than zero.
- Original price is optional. Requiring it would incorrectly exclude non-discounted offers.
- When supplied, original price must be greater than zero and `>= current_price`.
- Equal prices are valid but produce no discount or savings badge.
- Database `numeric(12,2)` remains the storage precision; form input accepts up to two decimals.

## 6. Category and merchant activity

- Drafts may use an inactive category, allowing editorial preparation.
- Published products require an active category.
- Inactive offers may reference an inactive merchant without supporting publication.
- Active offers require an active merchant in application actions.
- Only active offers from active merchants can support publication or public price cards.

## 7. Affiliate URL and currency

Affiliate URLs must be absolute HTTP or HTTPS URLs and no more than 2,048 characters. The contract does not require an Amazon-only hostname because merchants are modeled independently. Redirect safety and affiliate-host allowlisting remain Phase 13 concerns.

Currency must match `^[A-Z]{3}$`. This is a format contract, not a guarantee that every syntactically valid code is an ISO 4217 tender. A restricted supported-currency list requires a separate product decision.

## 8. Offer freshness

No approved freshness SLA currently exists. Therefore:

- `last_checked_at` remains nullable;
- stale or unchecked offers remain visible and can remain eligible;
- the UI discloses the checked date or “date unavailable”;
- freshness does not silently unpublish products.

QA-013/Phase 13 must define the SLA and any grace period before freshness can become an eligibility rule. Introducing a cutoff now would unexpectedly hide valid inventory.

## 9. Public visibility

- Products require `status = 'published'`.
- Public price cards and lowest-price calculations use only the shared full eligible-offer predicate.
- Product detail may show valid active out-of-stock/unknown offers for comparison, but those offers do not determine the lowest purchasable price.
- RLS remains mandatory and is defense in depth; application helpers do not replace RLS.
- A published product that loses its last eligible offer or active category must be rejected by deferred readiness enforcement at transaction commit.

## 10. Structured-data mapping

| Internal availability | Schema.org |
|---|---|
| `in_stock` | `InStock` |
| `limited_stock` | `LimitedAvailability` |
| `pre_order` | `PreOrder` |
| `out_of_stock` | `OutOfStock` |
| `unknown`/invalid/null | `OutOfStock` |

Using `OutOfStock` for unknown is conservative and avoids claiming purchasability. Structured data now uses the same availability definition as validation and public eligibility.

## 11. Validation error codes

| Code | Safe message |
|---|---|
| `PRODUCT_CATEGORY_INACTIVE` | Published products require an active category. |
| `PRODUCT_OFFER_REQUIRED` | Published products require at least one eligible active offer. |
| `OFFER_MERCHANT_INACTIVE` | Active offers require an active merchant. |
| `OFFER_URL_INVALID` | Enter a complete HTTP or HTTPS affiliate URL within 2,048 characters. |
| `OFFER_CURRENT_PRICE_INVALID` | Enter a current price greater than zero with up to two decimals. |
| `OFFER_ORIGINAL_PRICE_INVALID` | Original price must be greater than zero and cannot be lower than the current price. |
| `OFFER_CURRENCY_INVALID` | Use a three-letter uppercase currency code such as INR. |
| `OFFER_AVAILABILITY_INVALID` | Select a supported availability. |

Database exceptions use stable uppercase codes in their messages and SQLSTATE `23514`/`23503` as appropriate. Application errors remain safe and do not expose secrets.

## 12. Database enforcement

After production verification, the database must provide:

- the existing five-value availability check from migration 019;
- positive/current and nonnegative original price constraints;
- the existing unique product/merchant constraint;
- a replaced readiness assertion containing the complete eligible-offer predicate;
- existing deferred product/offer readiness triggers calling that assertion;
- a save RPC whose original-price and availability rules match the assertion;
- authenticated-only execution and existing admin RLS—no public writes.

The proposed migration intentionally does not alter data, replace policies, recreate triggers, or redesign offer replacement. Phase 2B owns transaction redesign. It is safe to review now but safe to apply only after production verification confirms migrations 016 and 019 and a staging contract test passes.
