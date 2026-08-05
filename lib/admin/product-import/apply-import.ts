import { matchImportReference } from "./match-record";
import { matchImportedCategory } from "@/lib/catalog/category-mapping";
import type { ImportReference, ProductImportApplication, ProductImportPreview, ProductImportParseResult } from "./types";

export function prepareProductImport(
  parsed: Extract<ProductImportParseResult, { success: true }>,
  references: { categories: ImportReference[]; brands: ImportReference[]; merchants: ImportReference[] },
): ProductImportPreview {
  const { product } = parsed;
  const warnings = [...parsed.warnings];
  const application: ProductImportApplication = { status: product.status };
  if (product.productName !== undefined) application.productName = product.productName;
  if (product.slug !== undefined) application.slug = product.slug;
  if (product.shortDescription !== undefined) application.shortDescription = product.shortDescription;
  if (product.description !== undefined) application.longDescription = product.description;
  if (product.highlights !== undefined) application.highlights = product.highlights;
  if (product.specifications !== undefined) application.specifications = product.specifications;
  if (product.seoTitle !== undefined) application.seoTitle = product.seoTitle;
  if (product.seoDescription !== undefined) application.seoDescription = product.seoDescription;
  if (product.featuredProduct !== undefined) application.featuredProduct = product.featuredProduct;
  if (product.trendingProduct !== undefined) application.trendingProduct = product.trendingProduct;
  if (product.category !== undefined) {
    const match = matchImportedCategory(product.category, references.categories);
    application.categoryId = match.id ?? "";
    application.subcategory = product.subcategory ?? match.subcategory;
    warnings.push(...match.warnings);
    if (match.message) warnings.push({ field: "category", message: match.message });
  }
  if (product.brand !== undefined) {
    const match = matchImportReference(product.brand, references.brands, "Brand");
    application.brandId = match.id ?? "";
    application.brandName = product.brand;
    if (match.id) warnings.push(...match.warnings);
  }
  const hasOfferField = [product.merchant, product.affiliateUrl, product.currentPrice, product.originalPrice,
    product.currency, product.stockStatus, product.activeOffer, product.offerLabel].some((value) => value !== undefined);
  const normalizedOffers=product.offers??(hasOfferField?[{merchant:product.merchant,affiliateUrl:product.affiliateUrl,currentPrice:product.currentPrice,originalPrice:product.originalPrice,currency:product.currency,stockStatus:product.stockStatus,activeOffer:product.activeOffer,offerLabel:product.offerLabel}]:[]);
  application.offers=normalizedOffers.map((offer,index)=>{
    const applied:NonNullable<ProductImportApplication["offer"]>={};
    if(offer.merchant!==undefined){const match=matchImportReference(offer.merchant,references.merchants,"Merchant");applied.merchantId=match.id??"";warnings.push(...match.warnings);if(!match.id)warnings.push({field:`offers.${index}.merchant`,message:`Merchant '${offer.merchant}' was not found. Add the merchant in Admin → Merchants before importing this offer.`});}
    if(offer.affiliateUrl!==undefined)applied.affiliateUrl=offer.affiliateUrl;if(offer.currentPrice!==undefined)applied.currentPrice=offer.currentPrice;if(offer.originalPrice!==undefined)applied.originalPrice=offer.originalPrice;if(offer.currency!==undefined)applied.currency=offer.currency;if(offer.stockStatus!==undefined)applied.stockStatus=offer.stockStatus;if(offer.activeOffer!==undefined)applied.isActive=offer.activeOffer;if(offer.offerLabel!==undefined)applied.offerTitle=offer.offerLabel;if(offer.couponCode!==undefined)applied.couponCode=offer.couponCode;if(offer.shippingNote!==undefined)applied.shippingNote=offer.shippingNote;if(offer.lastCheckedAt!==undefined)applied.lastCheckedAt=offer.lastCheckedAt;return applied;
  });
  if(application.offers.length===1)application.offer=application.offers[0];
  if(!application.offers.length)delete application.offers;
  for (const field of ["searchTags", "pros", "considerations", "faq"] as const) {
    if (product[field] !== undefined) warnings.push({ field, message: `${field} was validated but the current Add Product form/database write path does not support this field, so it was not applied.` });
  }
  const categoryMatch = product.category === undefined ? undefined : matchImportedCategory(product.category, references.categories);
  return { application, product, warnings, importedFields: parsed.importedFields, categoryMessage: categoryMatch?.message, categorySuggestion: categoryMatch?.suggestion };
}
