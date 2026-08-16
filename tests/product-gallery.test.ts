import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { normalizeGalleryImages, ProductGallery, swipeTargetIndex } from "../components/product/product-gallery";
import { ShareProductButton } from "../components/product/share-product-button";

const images = [
  { id: "one", imageUrl: "/product-images/11111111-1111-4111-8111-111111111111", altText: "Front" },
  { id: "two", imageUrl: "/product-images/22222222-2222-4222-8222-222222222222", altText: "Back" },
];

test("gallery normalization removes empty, unsafe, and duplicate URLs without dropping valid secondary images", () => {
  const normalized = normalizeGalleryImages([
    ...images,
    { id: "duplicate", imageUrl: images[0].imageUrl, altText: "Duplicate" },
    { id: "empty", imageUrl: "   ", altText: null },
    { id: "blob", imageUrl: "blob:https://example.com/temporary", altText: null },
  ], null, "Test product");
  assert.deepEqual(normalized.map((image) => image.id), ["one", "two"]);
});

test("one-image gallery does not render autoplay navigation controls", () => {
  const html = renderToStaticMarkup(createElement(ProductGallery, { imageUrl: null, images: [images[0]], productName: "Test product" }));
  assert.doesNotMatch(html, /Previous product image|Next product image|Choose product image/);
});

test("multi-image gallery renders only dot controls without arrows or thumbnails", () => {
  const html = renderToStaticMarkup(createElement(ProductGallery, { imageUrl: null, images, productName: "Test product" }));
  assert.match(html, /Choose product image/);
  assert.match(html, /View product image 2/);
  assert.doesNotMatch(html, /Previous product image|Next product image|View Test product image/);
});

test("gallery renders one fixed action overlay outside slides and navigation", () => {
  const action = createElement(ShareProductButton, { title: "Test product", text: "Description", url: "https://hypebuzzshop.in/products/test-product" });
  const html = renderToStaticMarkup(createElement(ProductGallery, { action, imageUrl: null, images, productName: "Test product" }));
  assert.equal(html.match(/aria-label="Share product"/g)?.length, 1);
  assert.equal(html.match(/data-gallery-action/g)?.length, 1);
  assert.match(html, /data-gallery-action[^>]*><div[^>]*><button/);
  assert.doesNotMatch(html, /aria-label="View product image [^"]+"[^>]*>[\s\S]*aria-label="Share product"/);
});

test("swipe gestures navigate, wrap, and preserve vertical scrolling intent", () => {
  assert.equal(swipeTargetIndex({ x: 200, y: 100 }, { x: 120, y: 105 }, 0, 2), 1);
  assert.equal(swipeTargetIndex({ x: 120, y: 100 }, { x: 200, y: 105 }, 1, 2), 0);
  assert.equal(swipeTargetIndex({ x: 120, y: 100 }, { x: 140, y: 102 }, 0, 2), 0);
  assert.equal(swipeTargetIndex({ x: 120, y: 100 }, { x: 180, y: 200 }, 0, 2), 0);
  assert.equal(swipeTargetIndex({ x: 120, y: 100 }, { x: 200, y: 102 }, 0, 1), 0);
});

test("gallery source implements reduced-motion autoplay, swipe, preloading, timer cleanup, and failure removal", () => {
  const source = readFileSync("components/product/product-gallery.tsx", "utf8");
  assert.match(source, /autoplayDelayMs = 3500/);
  assert.match(source, /prefers-reduced-motion: reduce/);
  assert.match(source, /onPointerDown/);
  assert.match(source, /onPointerUp/);
  assert.match(source, /visibilitychange/);
  assert.match(source, /onMouseEnter/);
  assert.match(source, /new window\.Image\(\)/);
  assert.match(source, /window\.clearTimeout\(autoplayTimer\.current\)/);
  assert.match(source, /setFailedIds/);
  assert.match(source, /action \? <div[^>]+data-gallery-action/);
  assert.match(source, /event\.stopPropagation\(\)/);
});
