import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ShareProductButton } from "../components/product/share-product-button";
import { productSocialDetails, publicHttpsUrl } from "../lib/products/social-sharing";

const product = {
  name: "Sony WH-1000XM5",
  slug: "sony-wh-1000xm5",
  seoTitle: null,
  seoDescription: null,
  shortDescription: "Wireless noise cancelling headphones.",
  description: "Long product description.",
  imageUrl: "/product-images/11111111-1111-4111-8111-111111111111",
  images: [{ imageUrl: "/product-images/11111111-1111-4111-8111-111111111111" }],
};

test("published product social details use real content and canonical public URLs", () => {
  const social = productSocialDetails(product);
  assert.equal(social.title, product.name);
  assert.equal(social.description, product.shortDescription);
  assert.equal(social.canonicalUrl, "https://hypebuzzshop.in/products/sony-wh-1000xm5");
  assert.equal(social.imageUrl, "https://hypebuzzshop.in/product-images/11111111-1111-4111-8111-111111111111");
  assert.match(social.imageUrl, /^https:\/\//);
  assert.doesNotMatch(JSON.stringify(social), /localhost|\/go\/|affiliate/i);
});

test("social copy honors SEO overrides, stays concise, and rejects non-HTTPS images", () => {
  const social = productSocialDetails({ ...product, seoTitle: "Exact SEO title", seoDescription: "Exact SEO description", imageUrl: "http://example.com/product.jpg", images: [] });
  assert.equal(social.title, "Exact SEO title");
  assert.equal(social.description, "Exact SEO description");
  assert.equal(social.imageUrl, "https://hypebuzzshop.in/brand/hypebuzz-banner-v3.png");
  assert.equal(publicHttpsUrl("blob:https://example.com/id"), null);
});

test("share button renders with accessible copy feedback", () => {
  const html = renderToStaticMarkup(createElement(ShareProductButton, { title: product.name, text: product.shortDescription, url: "https://hypebuzzshop.in/products/sony-wh-1000xm5" }));
  assert.match(html, /Share product/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /role="status"/);
});

test("share implementation prefers Web Share and copies only the canonical HypeBuzz URL", () => {
  const source = readFileSync("components/product/share-product-button.tsx", "utf8");
  const page = readFileSync("app/products/[slug]/page.tsx", "utf8");
  assert.match(source, /navigator\.share\(\{ title, text, url \}\)/);
  assert.match(source, /navigator\.clipboard\.writeText\(url\)/);
  assert.match(source, /document\.execCommand\("copy"\)/);
  assert.match(source, /AbortError/);
  assert.match(page, /<ShareProductButton/);
  assert.match(page, /url=\{social\.canonicalUrl\}/);
  assert.doesNotMatch(source, /\/go\/|affiliate_url|whatsapp/i);
});

test("existing product SEO, page features, public image route, and publication filters remain intact", () => {
  const page = readFileSync("app/products/[slug]/page.tsx", "utf8");
  const productData = readFileSync("lib/data/public-product.ts", "utf8");
  const imageRoute = readFileSync("app/product-images/[id]/route.ts", "utf8");
  for (const expected of [/alternates: \{ canonical:/, /"@type": "Product"/, /<ProductGallery/, /<ProductInformationTabs/, /<PriceComparison/, /getPublicProductReviews/]) {
    assert.match(page, expected);
  }
  assert.match(productData, /\.eq\("status", "published"\)/);
  assert.match(imageRoute, /Cache-Control.*public/);
  assert.match(imageRoute, /source_type","upload/);
});
