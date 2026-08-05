import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ProductJsonImporter } from "../components/admin/product-json-importer";
import { prepareProductImport } from "../lib/admin/product-import/apply-import";
import { productImportExample } from "../lib/admin/product-import/example";
import { cleanImportedReferenceDisplayName, matchImportReference } from "../lib/admin/product-import/match-record";
import { parseProductImportJson } from "../lib/admin/product-import/schema";
import { matchImportedCategory } from "../lib/catalog/category-mapping";
import { importedBrandProductionError } from "../lib/admin/product-import/brand-error";
import { assessAdminIdentity } from "../lib/auth/admin-identity";

const references = {
  categories: [{ id: "category-1", name: "Sports Shoes", slug: "sports-shoes", isActive: true }, { id: "fashion", name: "Fashion", slug: "fashion", isActive: true }],
  brands: [{ id: "brand-1", name: "ASIAN", slug: "asian", isActive: true }, { id: "uvsmart", name: "UVSMART", slug: "uvsmart", isActive: true }],
  merchants: [{ id: "merchant-1", name: "Amazon", slug: "amazon", isActive: true }, { id: "merchant-2", name: "Flipkart", slug: "flipkart", isActive: true }],
};

const uvsmartPayload = {
  product: {
    productName: "UVSMART Matt Sunscreen Gel 50g", slug: "uvsmart-matt-sunscreen-gel-50g", brand: "UVSMART", category: "Fashion", subcategory: "Sunscreen",
    shortDescription: "UVSMART Matt Sunscreen Gel is a 50g broad-spectrum sunscreen for daily skin protection.", longDescription: "UVSMART Matt Sunscreen Gel is a 50g sunscreen designed for everyday sun protection.",
    highlights: ["50g sunscreen gel", "Matte finish", "Broad-spectrum sunscreen"], specifications: { Brand: "UVSMART", "Product Type": "Sunscreen Gel", "Net Quantity": "50 g" },
    featuredProduct: false, trendingProduct: true, seoTitle: "UVSMART Matt Sunscreen Gel 50g", seoDescription: "Compare UVSMART Matt Sunscreen Gel 50g offers from Amazon and Flipkart.", status: "draft",
  },
  offers: [
    { merchant: "Flipkart", merchantProductTitle: "UVSMART Sunscreen", currentPrice: 683, originalPrice: 945, currency: "INR", discountPercent: 28, availability: "in_stock", affiliateUrl: "", productUrl: "", coupon: "10% off core coupon shown", shippingInformation: "Delivery information shown", offerTitle: "Lowest Price since Launch", seller: "NAVYAMEDICO" },
    { merchant: "Amazon", merchantProductTitle: "Mankind UVSmart Matt Sunscreen", currentPrice: 878, originalPrice: 945, currency: "INR", discountPercent: 7, availability: "in_stock", affiliateUrl: "", productUrl: "", coupon: "Up to ₹100 cashback", shippingInformation: "Prime delivery benefits shown", offerTitle: "", seller: "Not Available" },
  ],
};

function parse(value: unknown) {
  const result = parseProductImportJson(JSON.stringify(value));
  assert.equal(result.success, true);
  if (!result.success) throw new Error("Expected product JSON to parse.");
  return result;
}

test("valid complete JSON normalizes and prepares matching form fields", () => {
  const preview = prepareProductImport(parse(productImportExample), references);
  assert.equal(preview.application.productName, productImportExample.productName);
  assert.equal(preview.application.categoryId, "category-1");
  assert.equal(preview.application.brandId, "brand-1");
  assert.equal(preview.application.offers?.length, 2);
  assert.equal(preview.application.offer, undefined);
  assert.equal(preview.application.offers?.[0].affiliateUrl, productImportExample.offers[0].affiliateUrl);
  assert.equal(preview.application.offers?.[0].currentPrice, productImportExample.offers[0].currentPrice);
  assert.equal(preview.application.status, productImportExample.status);
  assert.equal(preview.application.subcategory, productImportExample.subcategory ?? productImportExample.category);
  assert.equal(preview.product.highlights?.length, 4);
  assert.equal(Object.keys(preview.product.specifications ?? {}).length, 6);
});

test("legacy single-offer JSON remains backward compatible", () => {
  const preview = prepareProductImport(parse({ merchant: "Amazon", affiliateUrl: "https://amazon.in/item", currentPrice: 999 }), references);
  assert.equal(preview.application.offers?.length, 1);
  assert.equal(preview.application.offer?.merchantId, "merchant-1");
  assert.equal(preview.application.offer?.currentPrice, 999);
});

test("nested UVSMART master product and two offers normalize into one form application", () => {
  const parsed = parse(uvsmartPayload);
  assert.equal(parsed.product.productName, "UVSMART Matt Sunscreen Gel 50g");
  assert.equal(parsed.product.brand, "UVSMART");
  assert.equal(parsed.product.category, "Fashion");
  assert.equal(parsed.product.offers?.length, 2);
  assert.deepEqual(parsed.product.offers?.map((offer) => offer.merchant), ["Flipkart", "Amazon"]);
  assert.deepEqual(parsed.product.offers?.map((offer) => offer.currentPrice), [683, 878]);
  assert.deepEqual(parsed.product.offers?.map((offer) => offer.originalPrice), [945, 945]);
  assert.deepEqual(parsed.product.offers?.map((offer) => offer.stockStatus), ["in_stock", "in_stock"]);
  assert.equal(parsed.product.offers?.[0].shippingNote, "Delivery information shown");
  assert.equal(parsed.product.offers?.[0].couponCode, "10% off core coupon shown");
  assert.ok(parsed.warnings.filter((warning) => warning.message.includes("affiliate URL is required before saving")).length === 2);

  const preview = prepareProductImport(parsed, references);
  assert.equal(preview.application.productName, "UVSMART Matt Sunscreen Gel 50g");
  assert.equal(preview.application.brandId, "uvsmart");
  assert.equal(preview.application.categoryId, "fashion");
  assert.equal(preview.application.offers?.length, 2);
  assert.deepEqual(preview.application.offers?.map((offer) => offer.merchantId), ["merchant-2", "merchant-1"]);
  assert.deepEqual(preview.application.offers?.map((offer) => offer.currentPrice), [683, 878]);
  assert.deepEqual(preview.application.offers?.map((offer) => offer.affiliateUrl), [undefined, undefined]);
});

test("malformed nested product objects fail instead of reporting an empty successful import", () => {
  assert.deepEqual(parseProductImportJson(JSON.stringify({ product: "invalid", offers: [{ merchant: "Amazon" }] })), { success: false, error: "Product must be an object containing the master product fields." });
  assert.deepEqual(parseProductImportJson(JSON.stringify({ product: {} })), { success: false, error: "No supported product or offer fields were found in this JSON." });
});

test("one through five explicit offers are accepted and keep independent prices", () => {
  for (let count = 1; count <= 5; count += 1) {
    const merchants = Array.from({ length: count }, (_, index) => ({ id: `m-${index}`, name: `Merchant ${index}`, slug: `merchant-${index}`, isActive: true }));
    const offers = merchants.map((merchant, index) => ({ merchant: merchant.name, affiliateUrl: `https://example.com/${index}`, currentPrice: 100 + index }));
    const preview = prepareProductImport(parse({ productName: "Multi offer", offers }), { ...references, merchants });
    assert.equal(preview.application.offers?.length, count);
    assert.deepEqual(preview.application.offers?.map((offer) => offer.currentPrice), offers.map((offer) => offer.currentPrice));
  }
});

test("more than five offers and duplicate merchants are rejected clearly", () => {
  const six = parseProductImportJson(JSON.stringify({ offers: Array.from({ length: 6 }, (_, index) => ({ merchant: `Merchant ${index}` })) }));
  assert.deepEqual(six, { success: false, error: "Maximum 5 merchant offers are currently supported in one product import." });
  const duplicate = parseProductImportJson(JSON.stringify({ offers: [{ merchant: "Amazon" }, { merchant: " amazon  " }] }));
  assert.equal(duplicate.success, false);
  if (!duplicate.success) assert.match(duplicate.error, /appears more than once/);
});

test("an unknown merchant and an invalid later offer URL remain visible as import warnings", () => {
  const preview = prepareProductImport(parse({ offers: [
    { merchant: "Amazon", affiliateUrl: "https://amazon.in/good", currentPrice: 100 },
    { merchant: "Unknown Shop", affiliateUrl: "javascript:bad", currentPrice: 90 },
  ] }), references);
  assert.equal(preview.application.offers?.[1].merchantId, "");
  assert.equal(preview.application.offers?.[1].affiliateUrl, undefined);
  assert.ok(preview.warnings.some((warning) => warning.message.includes("Unknown Shop")));
  assert.ok(preview.warnings.some((warning) => warning.message.includes("affiliate URL")));
});

test("valid partial JSON leaves absent values out of the application", () => {
  const preview = prepareProductImport(parse({ productName: "Partial product" }), references);
  assert.equal(preview.application.productName, "Partial product");
  assert.equal(preview.application.slug, "partial-product");
  assert.equal(preview.application.brandId, undefined);
  assert.equal(preview.application.offer, undefined);
});

test("invalid JSON syntax returns a specific error", () => {
  const result = parseProductImportJson('{"productName": "Broken",}');
  assert.deepEqual(result, { success: false, error: "Invalid JSON. Check commas, quotation marks and brackets." });
});

test("unknown category and merchant remain unselected while a missing brand is queued for server resolution", () => {
  const preview = prepareProductImport(parse({ category: "Unknown category", brand: "Unknown brand", merchant: "Unknown merchant" }), references);
  assert.equal(preview.application.categoryId, "");
  assert.equal(preview.application.brandId, "");
  assert.equal(preview.application.brandName, "Unknown brand");
  assert.equal(preview.application.offer?.merchantId, "");
  assert.ok(preview.warnings.some((warning) => warning.message.includes("Category 'Unknown category' was not found")));
  assert.ok(preview.warnings.some((warning) => warning.message.includes("Merchant 'Unknown merchant' was not found")));
});

test("category aliases map only to active parent categories that actually exist", () => {
  const categories = [
    { id: "sports", name: "Sports", slug: "sports", isActive: true },
    { id: "mobiles", name: "Mobiles", slug: "mobiles", isActive: true },
    { id: "audio", name: "Audio", slug: "audio", isActive: true },
  ];
  const sportsShoes = matchImportedCategory("Sports Shoes", categories);
  assert.equal(sportsShoes.id, "sports");
  assert.equal(sportsShoes.subcategory, "Sports Shoes");
  assert.equal(matchImportedCategory("Running Shoes", categories).id, "sports");
  assert.equal(matchImportedCategory("Smartphones", categories).id, "mobiles");
  assert.equal(matchImportedCategory("Earbuds", categories).id, "audio");
});

test("unknown category never defaults to Mobiles", () => {
  const result = matchImportedCategory("Industrial generators", [{ id: "mobiles", name: "Mobiles", slug: "mobiles", isActive: true }]);
  assert.equal(result.id, undefined);
});

test("reference matching follows slug, case-insensitive name, and normalized name", () => {
  assert.equal(matchImportReference("sports-shoes", references.categories, "Category").id, "category-1");
  assert.equal(matchImportReference("SPORTS SHOES", references.categories, "Category").id, "category-1");
  assert.equal(matchImportReference(" sports   shoes ", references.categories, "Category").id, "category-1");
});

test("brand display names are cleaned without changing capitalization", () => {
  assert.equal(cleanImportedReferenceDisplayName("  ASIAN   Footwear  "), "ASIAN Footwear");
  assert.equal(matchImportReference("asian", references.brands, "Brand").id, "brand-1");
  assert.equal(matchImportReference("AsIaN", references.brands, "Brand").id, "brand-1");
});

test("brand insert failures produce useful safe causes", () => {
  assert.equal(importedBrandProductionError({ code: "42501" }, "ASIAN"), "Brand creation was blocked by admin permissions.");
  assert.equal(importedBrandProductionError({ code: "PGRST204" }, "ASIAN"), "Brand could not be created because a required database field is missing.");
  assert.match(importedBrandProductionError({ code: "XX000" }, "ASIAN"), /Retry/);
});

test("brand creation authentication distinguishes missing, inactive, non-admin, and active admin sessions", () => {
  assert.match(assessAdminIdentity({ userId: null, authFailed: false, admin: null, adminLookupFailed: false }).message, /missing or expired/);
  assert.match(assessAdminIdentity({ userId: "user", authFailed: true, admin: null, adminLookupFailed: false }).message, /missing or expired/);
  assert.equal(assessAdminIdentity({ userId: "user", authFailed: false, admin: { user_id: "user", role: "admin", is_active: false }, adminLookupFailed: false }).allowed, false);
  assert.equal(assessAdminIdentity({ userId: "user", authFailed: false, admin: { user_id: "user", role: "editor", is_active: true }, adminLookupFailed: false }).allowed, false);
  assert.equal(assessAdminIdentity({ userId: "user", authFailed: false, admin: { user_id: "user", role: "admin", is_active: true }, adminLookupFailed: false }).allowed, true);
});

test("numeric and formatted rupee prices normalize safely", () => {
  assert.equal(parse({ currentPrice: 899 }).product.currentPrice, 899);
  assert.equal(parse({ price: "₹899" }).product.currentPrice, 899);
  assert.equal(parse({ mrp: "1,999" }).product.originalPrice, 1999);
  assert.equal(parse({ original_price: "₹1,999.00" }).product.originalPrice, 1999);
});

test("duplicate highlights are removed and empty values ignored", () => {
  assert.deepEqual(parse({ highlights: ["Lightweight", "", "Lightweight", "Cushioned"] }).product.highlights, ["Lightweight", "Cushioned"]);
});

test("missing slug is generated from product name", () => {
  assert.equal(parse({ productName: "A Great Product!" }).product.slug, "a-great-product");
});

test("invalid affiliate URL is ignored with a warning", () => {
  const result = parse({ affiliateUrl: "javascript:alert(1)" });
  assert.equal(result.product.affiliateUrl, undefined);
  assert.ok(result.warnings.some((warning) => warning.message === "The affiliate URL is not valid."));
});

test("boolean aliases normalize true/false, yes/no, and 1/0", () => {
  const product = parse({ activeOffer: "yes", isFeatured: 1, isTrending: "false" }).product;
  assert.equal(product.activeOffer, true);
  assert.equal(product.featuredProduct, true);
  assert.equal(product.trendingProduct, false);
});

test("published import only prepares form state and performs no save", () => {
  const preview = prepareProductImport(parse({ status: "published" }), references);
  assert.equal(preview.application.status, "published");
  assert.deepEqual(Object.keys(preview.application), ["status"]);
});

test("import application cannot replace or clear existing images", () => {
  const existing = { images: [{ id: "image-1" }], name: "Old" };
  const application = prepareProductImport(parse({ productName: "New" }), references).application;
  const merged = { ...existing, name: application.productName ?? existing.name };
  assert.deepEqual(merged.images, existing.images);
  assert.equal(Object.hasOwn(application, "images"), false);
});

test("prototype-pollution keys are rejected recursively", () => {
  const direct = parseProductImportJson('{"__proto__":{"polluted":true}}');
  const nested = parseProductImportJson('{"specifications":{"constructor":"bad"}}');
  assert.equal(direct.success, false);
  assert.equal(nested.success, false);
});

test("one invalid FAQ entry does not break valid FAQ entries", () => {
  const result = parse({ faq: [{ question: "Valid?", answer: "Yes." }, { question: "Missing answer" }, null] });
  assert.deepEqual(result.product.faq, [{ question: "Valid?", answer: "Yes." }]);
  assert.ok(result.warnings.some((warning) => warning.field === "faq"));
});

test("mobile-friendly importer renders as a collapsed full-width details card", () => {
  const markup = renderToStaticMarkup(createElement(ProductJsonImporter, { ...references, onApply: () => undefined }));
  assert.match(markup, /^<details/);
  assert.doesNotMatch(markup, /<details[^>]* open/);
  assert.match(markup, /w-full/);
  assert.match(markup, /sm:flex-row/);
});
