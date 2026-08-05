import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { absoluteUrl, getSiteUrl, productionSiteOrigin, siteDescription, siteTitle } from "../lib/seo/site";

test("production SEO origin is fixed to the custom domain", () => {
  const previous = process.env.NEXT_PUBLIC_SITE_URL;
  try {
    process.env.NEXT_PUBLIC_SITE_URL = "https://hypebuzz.vercel.app";
    assert.equal(productionSiteOrigin, "https://hypebuzzshop.in");
    assert.equal(getSiteUrl().origin, productionSiteOrigin);
    assert.equal(absoluteUrl("/"), "https://hypebuzzshop.in/");
    assert.equal(absoluteUrl("/products/example"), "https://hypebuzzshop.in/products/example");
    assert.equal(absoluteUrl("/sitemap.xml"), "https://hypebuzzshop.in/sitemap.xml");
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = previous;
  }
});

test("homepage metadata states the product-discovery and price-comparison positioning", () => {
  assert.equal(siteTitle, "HypeBuzz | Discover Products, Compare Prices & Find Deals");
  assert.match(siteDescription, /trending products/i);
  assert.match(siteDescription, /compare prices/i);
  assert.match(siteDescription, /trusted merchants/i);
});

test("priority public routes define self-canonicals and complete social metadata", () => {
  const routes = [
    ["app/trending/page.tsx", "/trending"],
    ["app/compare/page.tsx", "/compare"],
    ["app/knowledge-hub/page.tsx", "/knowledge-hub"],
    ["app/(company)/about/page.tsx", "/about"],
    ["app/(company)/contact/page.tsx", "/contact"],
  ] as const;

  for (const [file, pathname] of routes) {
    const source = readFileSync(file, "utf8");
    assert.match(source, new RegExp(`absoluteUrl\\(\"${pathname.replace("/", "\\/")}\"\\)`), `${file} canonical`);
    assert.match(source, /openGraph:/, `${file} Open Graph metadata`);
    assert.match(source, /twitter:/, `${file} Twitter metadata`);
    assert.match(source, /images:/, `${file} social image`);
  }
});

test("dynamic public routes retain route-specific metadata and structured data", () => {
  const product = readFileSync("app/products/[slug]/page.tsx", "utf8");
  const category = readFileSync("app/categories/[slug]/page.tsx", "utf8");
  const article = readFileSync("app/knowledge-hub/[slug]/page.tsx", "utf8");
  const articleSchema = readFileSync("app/knowledge-hub/[slug]/layout.tsx", "utf8");

  assert.match(product, /absoluteUrl\(`\/products\/\$\{product\.slug\}`\)/);
  assert.match(product, /"@type": "Product"/);
  assert.match(category, /absoluteUrl\(`\/categories\/\$\{category\.slug\}`\)/);
  assert.match(article, /absoluteUrl\(`\/knowledge-hub\/\$\{guide\.slug\}`\)/);
  assert.match(articleSchema, /"@type": "Article"/);
});

test("homepage artwork is decorative and excluded from SEO surfaces", () => {
  const featureCards = readFileSync("components/home/home-feature-card.tsx", "utf8");
  const homepage = readFileSync("app/page.tsx", "utf8");
  const sitemap = readFileSync("app/sitemap.ts", "utf8");
  const nextConfig = readFileSync("next.config.ts", "utf8");
  const decorativeAssets = ["hot-deal.png", "price-drop.png", "trending-products.png", "hypebuzz-hero-background.png"];

  for (const attribute of ['alt=""', 'aria-hidden="true"', 'role="presentation"', 'loading="lazy"', 'decoding="async"', 'fetchPriority="low"']) {
    assert.match(featureCards, new RegExp(attribute), `feature artwork ${attribute}`);
    assert.match(homepage, new RegExp(attribute), `hero background ${attribute}`);
  }
  for (const asset of decorativeAssets) {
    assert.doesNotMatch(sitemap, new RegExp(asset));
    assert.doesNotMatch(homepage.match(/const homepageStructuredData[\s\S]*?export default/)?.[0] ?? "", new RegExp(asset));
    assert.doesNotMatch(homepage.match(/export const metadata[\s\S]*?const homepageStructuredData/)?.[0] ?? "", new RegExp(asset));
    assert.match(nextConfig, new RegExp(asset.replaceAll(".", "\\.")));
  }
  assert.match(nextConfig, /X-Robots-Tag/);
  assert.match(nextConfig, /noindex, noimageindex/);
});

test("public product images link to product detail routes and retain image SEO", () => {
  const card = readFileSync("components/product/product-card.tsx", "utf8");
  const compare = readFileSync("components/compare/compare-page-client.tsx", "utf8");
  const productPage = readFileSync("app/products/[slug]/page.tsx", "utf8");
  const sitemap = readFileSync("app/sitemap.ts", "utf8");
  assert.match(card, /href=\{product\.productHref\}[\s\S]*alt=\{product\.imageAlt\}/);
  assert.match(compare, /href=\{`\/products\/\$\{product\.slug\}`\}[\s\S]*alt=\{product\.name\}/);
  assert.match(productPage, /"@type": "Product"[\s\S]*image: product\.images/);
  assert.match(sitemap, /products\.map[\s\S]*images: \[new URL\(product\.imageUrl/);
});
