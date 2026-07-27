# Product JSON to database mapping

This map is intentionally conservative. “Supported” means the current repository write path and baseline schema agree; migration 021 fields require live verification before use.

| JSON key | Form field | Server payload | Destination | Production support | Requirement | Action |
|---|---|---|---|---|---|---|
| productName | name | p_name | products.name | confirmed baseline | required | save directly |
| slug | slug | p_slug | products.slug | confirmed baseline, unique | required | save directly |
| brand | importedBrandName/brandId | brand_id | brands.id → products.brand_id | brand base columns confirmed; production rejected optional brand columns | optional | resolve to foreign key |
| category | categoryId | p_category_id | categories.id → products.category_id | confirmed baseline | required | resolve to foreign key |
| subcategory | importedSubcategory display state | omitted | none | no verified column | optional | ignore with warning |
| shortDescription | shortDescription | p_short_description | products.short_description | confirmed baseline | optional | save directly |
| description | longDescription | description | products.description | baseline migration; live verification required | optional | omit unless verified |
| highlights | highlights | highlights | products.highlights | migration 021 only | optional | migration required |
| specifications | specifications | specifications | products.specifications JSONB | baseline migration | optional | store in supported JSONB column |
| merchant | offer.merchantId | p_merchant_id | merchants.id → product_offers.merchant_id | confirmed baseline | publish required | resolve to foreign key |
| affiliateUrl | offer.affiliateUrl | p_affiliate_url | product_offers.affiliate_url | confirmed baseline | publish required | save in product_offers |
| currentPrice | offer.currentPrice | p_current_price | product_offers.current_price | confirmed baseline | publish required | save in product_offers |
| originalPrice | offer.originalPrice | p_original_price | product_offers.original_price | confirmed baseline | optional | save in product_offers |
| currency | offer.currency | p_currency | product_offers.currency | confirmed baseline | offer required | save in product_offers |
| stockStatus | offer.stockStatus | p_availability | product_offers.availability | confirmed baseline | offer required | save in product_offers |
| activeOffer | offer.isActive | p_offer_is_active | product_offers.is_active | confirmed baseline | offer required | save in product_offers |
| offerLabel | offer.offerTitle | offer_title | product_offers.offer_title | migration 019 only | optional | omit unless verified |
| discountPercentage | derived preview only | omitted | none | no column required; derive from prices | optional | ignore with warning |
| featuredProduct | isFeatured | p_is_featured | products.is_featured | confirmed baseline | optional | save directly |
| trendingProduct | isTrending | p_is_trending | products.is_trending | confirmed baseline | optional | save directly |
| status | status | p_status | products.status | confirmed baseline | required/default draft | save directly |
| seoTitle | seoTitle | seo_title | products.seo_title | migration 021 only | optional | migration required |
| seoDescription | seoDescription | seo_description | products.seo_description | migration 021 only | optional | migration required |
| searchTags | not applied | omitted | none | unsupported | optional | ignore with warning |
| pros | not applied | omitted | none | unsupported | optional | ignore with warning |
| considerations | not applied | omitted | none | unsupported | optional | ignore with warning |
| faq | not applied | omitted | none | unsupported | optional | ignore with warning |

Optional unsupported keys never block parsing or saving. Prices and affiliate data are never written to `products`.
