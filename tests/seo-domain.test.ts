import assert from "node:assert/strict";
import test from "node:test";
import { absoluteUrl, getSiteUrl, productionSiteOrigin } from "../lib/seo/site";

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
