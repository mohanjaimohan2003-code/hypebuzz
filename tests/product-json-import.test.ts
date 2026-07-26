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
  categories: [{ id: "category-1", name: "Sports Shoes", slug: "sports-shoes", isActive: true }],
  brands: [{ id: "brand-1", name: "ASIAN", slug: "asian", isActive: true }],
  merchants: [{ id: "merchant-1", name: "Amazon", slug: "amazon", isActive: true }],
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
  assert.equal(preview.application.offer?.merchantId, "merchant-1");
  assert.equal(preview.product.highlights?.length, 4);
  assert.equal(Object.keys(preview.product.specifications ?? {}).length, 6);
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
  assert.equal(matchImportedCategory("Sports Shoes", categories).id, "sports");
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
  const markup = renderToStaticMarkup(createElement(ProductJsonImporter, { ...references, onApply: () => undefined, onBrandResolved: () => undefined }));
  assert.match(markup, /^<details/);
  assert.doesNotMatch(markup, /<details[^>]* open/);
  assert.match(markup, /w-full/);
  assert.match(markup, /sm:flex-row/);
});
