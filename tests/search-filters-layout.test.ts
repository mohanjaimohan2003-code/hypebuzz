import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { parseProductSearchParams } from "../lib/validation/product-search";

const filters = readFileSync("components/search/search-filters.tsx", "utf8");
const searchPage = readFileSync("app/search/page.tsx", "utf8");
const categoryPage = readFileSync("app/categories/[slug]/page.tsx", "utf8");

test("desktop sidebar is replaced by a compact top filter form", () => {
  assert.doesNotMatch(filters, /<aside|w-\[280px\]|sticky top-40/);
  assert.match(filters, /aria-label="Product filters"/);
  assert.match(searchPage, /className="space-y-6"/);
  assert.match(categoryPage, /className="mt-8 space-y-6"/);
  assert.doesNotMatch(searchPage, /lg:flex-row lg:items-start/);
  assert.doesNotMatch(categoryPage, /lg:flex-row lg:items-start/);
});

test("primary filters remain visible and preserve their query parameter names", () => {
  for (const label of ["Brand", "Merchant", "Minimum discount"]) {
    assert.match(filters, new RegExp(`aria-label="${label}"`));
  }
  assert.match(filters, /const priceLabel[\s\S]*?: "Price"/);
  for (const name of ["brand", "merchant", "min_price", "max_price", "discount"]) {
    assert.match(filters, new RegExp(`name="${name}"`));
  }
});

test("secondary filters, reset, and apply remain available", () => {
  assert.match(filters, /More Filters/);
  for (const name of ["category", "availability", "best", "featured", "trending", "sort"]) {
    assert.match(filters, new RegExp(`name="${name}"`));
  }
  assert.match(filters, />Reset</);
  assert.match(filters, />Apply filters</);
  assert.match(filters, /method="get"/);
});

test("existing filtered URLs retain all supported search values", () => {
  const parsed = parseProductSearchParams({
    q: "phone",
    category: "mobiles",
    brand: "acme",
    merchant: "shop",
    min_price: "100",
    max_price: "500",
    discount: "25",
    availability: "In Stock",
    best: "1",
    sort: "price_low",
  });
  assert.deepEqual(parsed, {
    q: "phone",
    category: "mobiles",
    brand: "acme",
    merchant: "shop",
    minPrice: 100,
    maxPrice: 500,
    minDiscount: 25,
    availability: "In Stock",
    bestPriceOnly: true,
    sort: "price_low",
  });
});

test("product grids use full width and compact controls wrap on mobile", () => {
  assert.match(searchPage, /sm:grid-cols-2 xl:grid-cols-4/);
  assert.match(categoryPage, /sm:grid-cols-2 xl:grid-cols-4/);
  assert.match(filters, /flex flex-wrap/);
  assert.match(filters, /w-full sm:w-auto/);
  assert.doesNotMatch(filters, /overflow-x-auto/);
});

test("filter panels support native keyboard operation, Escape, and outside dismissal", () => {
  assert.match(filters, /<details/);
  assert.match(filters, /<summary/);
  assert.match(filters, /event\.key !== "Escape"/);
  assert.match(filters, /document\.addEventListener\("pointerdown"/);
  assert.match(filters, /focus-visible:ring-2/);
});
