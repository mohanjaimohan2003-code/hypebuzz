import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ProductInformationTabs } from "../components/product/product-information-tabs";

const reviewData = { slug: "test", summary: { totalReviews: 0, averageRating: null, counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } }, reviews: [], rating: "all" as const, sort: "recent" as const, limit: 5, hasMore: false, hasError: false };

test("information card renders accessible tabs and only the selected panel", () => {
  const html = renderToStaticMarkup(createElement(ProductInformationTabs, { description: "Description", specifications: [{ name: "Size", value: "L" }], reviewData }));
  assert.match(html, /role="tablist"/);
  assert.match(html, /role="tab"/);
  assert.match(html, /aria-selected="true"/);
  assert.match(html, /role="tabpanel"/);
  assert.match(html, /Description/);
  assert.doesNotMatch(html, />Size<|Customer Reviews/);
  assert.doesNotMatch(html, /Shipping\s*(?:&|and)\s*Returns/i);
});

test("tab implementation supports keyboard navigation without converting the page to a client component", () => {
  const tabs = readFileSync("components/product/product-information-tabs.tsx", "utf8");
  const page = readFileSync("app/products/[slug]/page.tsx", "utf8");
  assert.match(tabs, /ArrowRight/); assert.match(tabs, /ArrowLeft/); assert.match(tabs, /Home/); assert.match(tabs, /End/);
  assert.doesNotMatch(page, /^"use client"/);
});
