import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ShareProductButton } from "../components/product/share-product-button";
import { ProductCard } from "../components/product/product-card";
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

test("social copy keeps the clean product name, stays concise, and rejects non-HTTPS images", () => {
  const social = productSocialDetails({ ...product, seoTitle: "Product - Compare Prices & Offers | HypeBuzz", seoDescription: "Exact SEO description", imageUrl: "http://example.com/product.jpg", images: [] });
  assert.equal(social.title, product.name);
  assert.equal(social.description, "Exact SEO description");
  assert.equal(social.imageUrl, "https://hypebuzzshop.in/brand/hypebuzz-banner-v3.png");
  assert.equal(publicHttpsUrl("blob:https://example.com/id"), null);
});

test("social descriptions skip title-only copy and truncate long real content cleanly", () => {
  const social = productSocialDetails({
    ...product,
    seoDescription: product.name,
    shortDescription: null,
    description: "A real product description with useful details. ".repeat(10),
  });
  assert.notEqual(social.description, product.name);
  assert.ok(social.description.length <= 180);
  assert.match(social.description, /…$/);
});

test("share button renders with accessible copy feedback", () => {
  const html = renderToStaticMarkup(createElement(ShareProductButton, { title: product.name, text: product.shortDescription, url: "https://hypebuzzshop.in/products/sony-wh-1000xm5" }));
  assert.match(html, /aria-label="Share product"/);
  assert.doesNotMatch(html, /<\/svg>\s*Share product/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /role="status"/);
});

test("share implementation prefers Web Share and copies only the canonical HypeBuzz URL", () => {
  const source = readFileSync("components/product/share-product-button.tsx", "utf8");
  const page = readFileSync("app/products/[slug]/page.tsx", "utf8");
  assert.match(source, /navigator\.share\(\{ title, \.\.\.\(text \? \{ text \} : \{\}\), url \}\)/);
  assert.match(source, /navigator\.clipboard\.writeText\(url\)/);
  assert.match(source, /document\.execCommand\("copy"\)/);
  assert.match(source, /AbortError/);
  assert.equal(page.match(/<ShareProductButton/g)?.length, 1);
  assert.match(page, /<ProductGallery[\s\S]*action=\{<ShareProductButton/);
  assert.match(page, /url=\{social\.canonicalUrl\}/);
  assert.ok(page.indexOf("<ShareProductButton") < page.indexOf("Compare all"));
  assert.doesNotMatch(source, /\/go\/|affiliate_url|whatsapp/i);
});

test("reusable product cards render wishlist and local share actions without changing card navigation", () => {
  const cardProduct = {
    id: "product-id",
    name: product.name,
    brand: "Sony",
    imageSrc: product.imageUrl,
    imageAlt: product.name,
    price: 100,
    currency: "INR",
    storeCount: 1,
    productHref: `/products/${product.slug}`,
    dealsHref: `/products/${product.slug}#compare-prices`,
  };
  const html = renderToStaticMarkup(createElement(ProductCard, { product: cardProduct }));
  assert.match(html, /Add Sony WH-1000XM5 to wishlist/);
  assert.match(html, /aria-label="Share Sony WH-1000XM5"/);
  assert.match(html, /%2Ficons%2Fshare\.png/);
  assert.match(html, /href="\/products\/sony-wh-1000xm5"/);
  assert.match(html, /Compare/);
  assert.match(html, /View \(0\)/);
  assert.doesNotMatch(html, /\/go\/|affiliate_url|amazon|flipkart/i);
  assert.ok(existsSync("public/icons/share.png"));
});

test("card share is independent from links and all public listing surfaces inherit ProductCard", () => {
  const share = readFileSync("components/product/share-product-button.tsx", "utf8");
  const card = readFileSync("components/product/product-card.tsx", "utf8");
  assert.match(share, /event\.preventDefault\(\)/);
  assert.match(share, /event\.stopPropagation\(\)/);
  assert.match(card, /<WishlistButton[\s\S]*<ShareProductButton/);
  assert.match(card, /absolute right-2 top-2 flex/);
  assert.match(card, /absoluteUrl\(product\.productHref\)/);
  assert.doesNotMatch(card, /https?:\/\/[^"'`]*icon/i);

  for (const file of [
    "components/home/homepage-catalog.tsx",
    "app/search/page.tsx",
    "app/categories/[slug]/page.tsx",
    "app/trending/page.tsx",
  ]) {
    assert.match(readFileSync(file, "utf8"), /<ProductCard/);
  }
});

test("existing product SEO, page features, public image route, and publication filters remain intact", () => {
  const page = readFileSync("app/products/[slug]/page.tsx", "utf8");
  const productData = readFileSync("lib/data/public-product.ts", "utf8");
  const imageRoute = readFileSync("app/product-images/[id]/route.ts", "utf8");
  for (const expected of [/alternates: \{ canonical:/, /openGraph:/, /title: social\.title/, /description: social\.description/, /url: social\.canonicalUrl/, /images: \[\{ url: social\.imageUrl/, /card: "summary_large_image"/, /"@type": "Product"/, /<ProductGallery/, /<ProductInformationTabs/, /<PriceComparison/, /getPublicProductReviews/]) {
    assert.match(page, expected);
  }
  assert.match(productData, /\.eq\("status", "published"\)/);
  assert.match(imageRoute, /"Content-Type"/);
  assert.match(imageRoute, /Cache-Control.*public/);
  assert.match(imageRoute, /source_type","upload/);
});
