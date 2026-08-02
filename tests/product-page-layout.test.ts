import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("product page exposes only the approved information sections", () => {
  const source = readFileSync("app/products/[slug]/page.tsx", "utf8");
  assert.match(source, /<ProductInformationTabs/);
  assert.doesNotMatch(source, /Shipping\s*(?:&|and)\s*Returns/i);
});

test("tabs, price comparison, and related products follow the approved order", () => {
  const source = readFileSync("app/products/[slug]/page.tsx", "utf8");
  assert.ok(source.indexOf("<ProductInformationTabs") < source.indexOf("<PriceComparison"));
  assert.ok(source.indexOf("<PriceComparison") < source.indexOf("You might also like"));
});

test("product gallery is compact and contains no visible arrows or thumbnails", () => {
  const source = readFileSync("components/product/product-gallery.tsx", "utf8");
  assert.match(source, /aspect-\[4\/3\]/);
  assert.match(source, /Choose product image/);
  assert.doesNotMatch(source, /Previous product image|Next product image|grid-cols-4/);
});
