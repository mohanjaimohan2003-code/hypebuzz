import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ProductHighlights, ProductRichDetails } from "../components/product/product-rich-content";
import { ProductHighlightsField } from "../components/admin/product-highlights-field";
import { ProductSpecificationsField } from "../components/admin/product-specifications-field";
import { prepareProductImport } from "../lib/admin/product-import/apply-import";
import { parseProductImportJson } from "../lib/admin/product-import/schema";
import { discountPercent } from "../lib/offers/price-comparison";
import { normalizeHighlights, normalizeSpecifications, parseProductRichFields, richFieldsDatabasePayload } from "../lib/products/rich-fields";
import { productSeoCopy } from "../lib/products/seo";
import { validateProductForm } from "../lib/validation/product";

const categoryId = "33333333-3333-4333-8333-333333333333";

function productForm(rich: Partial<{ longDescription: string; highlights: unknown; specifications: unknown; seoTitle: string; seoDescription: string }> = {}) {
  const form = new FormData();
  form.set("name", "Rich product"); form.set("slug", "rich-product"); form.set("categoryId", categoryId);
  form.set("status", "draft"); form.set("imageManifest", "[]"); form.set("offerManifest", "[]");
  form.set("longDescription", rich.longDescription ?? "");
  form.set("highlightsManifest", JSON.stringify(rich.highlights ?? []));
  form.set("specificationsManifest", JSON.stringify(rich.specifications ?? {}));
  form.set("seoTitle", rich.seoTitle ?? ""); form.set("seoDescription", rich.seoDescription ?? "");
  return form;
}

test("creating a product with all rich fields validates and creates the database payload", () => {
  const form = productForm({ longDescription: "Detailed plain text.", highlights: ["Fast", "Light"], specifications: { Weight: "1 kg" }, seoTitle: "Rich SEO", seoDescription: "Rich description" });
  const result = validateProductForm(form);
  assert.equal(result.success, true);
  if (!result.success) return;
  assert.deepEqual(richFieldsDatabasePayload(result.data), { description: "Detailed plain text.", highlights: ["Fast", "Light"], specifications: { Weight: "1 kg" }, seo_title: "Rich SEO", seo_description: "Rich description" });
});

test("creating without optional rich fields remains valid", () => {
  const result = validateProductForm(productForm());
  assert.equal(result.success, true);
  if (result.success) assert.deepEqual(richFieldsDatabasePayload(result.data), { description: null, highlights: [], specifications: {}, seo_title: null, seo_description: null });
});

test("draft and publish validation return exact field reasons", () => {
  const draft = new FormData(); draft.set("status", "draft"); draft.set("imageManifest", "[]"); draft.set("offerManifest", "[]");
  const draftResult = validateProductForm(draft); assert.equal(draftResult.success, false);
  if (!draftResult.success) { assert.equal(draftResult.state.message, "Draft cannot be saved:"); assert.ok(draftResult.state.fieldErrors.name); assert.ok(draftResult.state.fieldErrors.slug); assert.ok(draftResult.state.fieldErrors.categoryId); assert.deepEqual(draftResult.state.validationErrors?.map((error) => error.field), ["name", "slug", "categoryId"]); }
  const publish = productForm(); publish.set("status", "published");
  const publishResult = validateProductForm(publish); assert.equal(publishResult.success, false);
  if (!publishResult.success) { assert.equal(publishResult.state.message, "Product cannot be published:"); assert.ok(publishResult.state.fieldErrors.offerList); assert.ok((publishResult.state.validationErrors?.length ?? 0) > 0); }
});

test("editing rich fields parses replacement values", () => {
  const parsed = parseProductRichFields(productForm({ longDescription: "Updated", highlights: ["New"], specifications: [{ label: "Colour", value: "Blue" }], seoTitle: "Updated title" }));
  assert.equal(parsed.values.longDescription, "Updated");
  assert.deepEqual(parsed.values.highlights, ["New"]);
  assert.deepEqual(parsed.values.specifications, { Colour: "Blue" });
  assert.equal(parsed.values.seoTitle, "Updated title");
});

test("JSON import now applies approved rich fields", () => {
  const parsed = parseProductImportJson(JSON.stringify({ description: "Long", highlights: ["One"], specifications: { Size: "Large" }, seoTitle: "SEO", seoDescription: "Description" }));
  assert.equal(parsed.success, true);
  if (!parsed.success) return;
  const preview = prepareProductImport(parsed, { categories: [], brands: [], merchants: [] });
  assert.equal(preview.application.longDescription, "Long");
  assert.deepEqual(preview.application.highlights, ["One"]);
  assert.deepEqual(preview.application.specifications, { Size: "Large" });
  assert.equal(preview.warnings.some((warning) => ["description", "highlights", "specifications", "seoTitle", "seoDescription"].includes(warning.field)), false);
});

test("missing imported rich fields preserve existing values", () => {
  const parsed = parseProductImportJson('{"productName":"Only name"}');
  assert.equal(parsed.success, true);
  if (!parsed.success) return;
  const application = prepareProductImport(parsed, { categories: [], brands: [], merchants: [] }).application;
  const existing = { longDescription: "Keep", highlights: ["Keep"], specifications: { Keep: "Yes" }, seoTitle: "Keep", seoDescription: "Keep" };
  const merged = { ...existing, ...Object.fromEntries(Object.entries(application).filter(([, value]) => value !== undefined)) };
  assert.equal(merged.longDescription, "Keep"); assert.deepEqual(merged.highlights, ["Keep"]); assert.deepEqual(merged.specifications, { Keep: "Yes" });
});

test("empty and exact duplicate highlights are removed consistently", () => {
  assert.deepEqual(normalizeHighlights([" Fast ", "", "Fast", "Light"]).value, ["Fast", "Light"]);
});

test("invalid and duplicate specification rows are reported", () => {
  assert.deepEqual(normalizeSpecifications([{ label: "", value: "ignored" }, { label: "Size", value: "L" }]).value, { Size: "L" });
  assert.match(normalizeSpecifications([{ label: "Size", value: "L" }, { label: "size", value: "M" }]).error ?? "", /duplicated/);
});

test("unsafe specification keys are rejected", () => {
  assert.match(normalizeSpecifications(JSON.parse('{"__proto__":"bad"}')).error ?? "", /not allowed/);
  assert.match(normalizeSpecifications({ prototype: "bad" }).error ?? "", /not allowed/);
  assert.match(normalizeSpecifications({ constructor: "bad" }).error ?? "", /not allowed/);
});

test("product rich content displays populated fields", () => {
  const highlights = renderToStaticMarkup(createElement(ProductHighlights, { highlights: ["Fast"] }));
  const details = renderToStaticMarkup(createElement(ProductRichDetails, { description: "Plain text", specifications: [{ name: "Weight", value: "1 kg" }] }));
  assert.match(highlights, /Highlights/); assert.match(highlights, /Fast/);
  assert.match(details, /About this product/); assert.match(details, /Specifications/); assert.match(details, /1 kg/);
});

test("product rich content hides empty sections", () => {
  assert.equal(renderToStaticMarkup(createElement(ProductHighlights, { highlights: [] })), "");
  assert.equal(renderToStaticMarkup(createElement(ProductRichDetails, { description: null, specifications: [] })), "");
});

test("SEO uses overrides and documented fallbacks", () => {
  const base = { name: "Phone", brand: { name: "Brand" }, seoTitle: null, seoDescription: null, shortDescription: "Short", description: "Long" };
  assert.deepEqual(productSeoCopy(base), { title: "Phone by Brand prices and offers", description: "Short" });
  assert.deepEqual(productSeoCopy({ ...base, seoTitle: "Custom", seoDescription: "Custom description" }), { title: "Custom", description: "Custom description" });
});

test("discount remains derived rather than stored", () => {
  assert.equal(discountPercent(899, 1999), 55);
  assert.equal(discountPercent(100, null), null);
  assert.equal(discountPercent(100, 100), null);
});

test("admin rich-field controls and public specifications retain mobile layouts", () => {
  const highlights = renderToStaticMarkup(createElement(ProductHighlightsField, { values: ["One"], onChange: () => undefined, disabled: false }));
  const specifications = renderToStaticMarkup(createElement(ProductSpecificationsField, { rows: [{ id: "1", label: "Size", value: "L" }], onChange: () => undefined, disabled: false }));
  const publicDetails = renderToStaticMarkup(createElement(ProductRichDetails, { description: null, specifications: [{ name: "Size", value: "L" }] }));
  assert.match(highlights, /sm:flex-row/); assert.match(specifications, /sm:grid-cols/); assert.match(publicDetails, /sm:grid-cols/);
});
