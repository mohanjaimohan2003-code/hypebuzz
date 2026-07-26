import { matchImportReference } from "./match-record";
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
    const match = matchImportReference(product.category, references.categories, "Category");
    application.categoryId = match.id ?? "";
    warnings.push(...match.warnings);
  }
  if (product.brand !== undefined) {
    const match = matchImportReference(product.brand, references.brands, "Brand");
    application.brandId = match.id ?? "";
    warnings.push(...match.warnings);
  }
  const hasOfferField = [product.merchant, product.affiliateUrl, product.currentPrice, product.originalPrice,
    product.currency, product.stockStatus, product.activeOffer, product.offerLabel].some((value) => value !== undefined);
  if (hasOfferField) {
    application.offer = {};
    if (product.merchant !== undefined) {
      const match = matchImportReference(product.merchant, references.merchants, "Merchant");
      application.offer.merchantId = match.id ?? "";
      warnings.push(...match.warnings);
    }
    if (product.affiliateUrl !== undefined) application.offer.affiliateUrl = product.affiliateUrl;
    if (product.currentPrice !== undefined) application.offer.currentPrice = product.currentPrice;
    if (product.originalPrice !== undefined) application.offer.originalPrice = product.originalPrice;
    if (product.currency !== undefined) application.offer.currency = product.currency;
    if (product.stockStatus !== undefined) application.offer.stockStatus = product.stockStatus;
    if (product.activeOffer !== undefined) application.offer.isActive = product.activeOffer;
    if (product.offerLabel !== undefined) application.offer.offerTitle = product.offerLabel;
  }
  for (const field of ["subcategory", "searchTags", "pros", "considerations", "faq"] as const) {
    if (product[field] !== undefined) warnings.push({ field, message: `${field} was validated but the current Add Product form/database write path does not support this field, so it was not applied.` });
  }
  return { application, product, warnings, importedFields: parsed.importedFields };
}
