import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PriceComparison } from "../components/product/price-comparison";
import { getBundledMerchantLogo, MerchantLogo } from "../components/product/merchant-logo";
import type { PublicProductOffer } from "../lib/data/public-product";
import { countEligibleStores, getBestEligibleOffer } from "../lib/offers/price-comparison";

function offer(overrides: Partial<PublicProductOffer> = {}): PublicProductOffer {
  return {
    id: "11111111-1111-4111-8111-111111111111", currentPrice: 899, originalPrice: 1999,
    currency: "INR", availability: "in_stock", lastCheckedAt: null,
    merchant: { name: "Amazon", slug: "amazon", logoUrl: null }, discount: 55,
    savings: 1100, isLowestPrice: true, couponCode: null, shippingNote: null, offerTitle: null,
    ...overrides,
  };
}

test("one eligible Amazon offer is the top offer and counts as one store", () => {
  const amazon = offer();
  assert.equal(getBestEligibleOffer([amazon])?.id, amazon.id);
  assert.equal(getBestEligibleOffer([amazon])?.merchant.name, "Amazon");
  assert.equal(countEligibleStores([amazon]), 1);
});

test("multiple offers select the lowest eligible offer and count unique eligible merchants", () => {
  const amazon = offer();
  const amazonDuplicate = offer({ id: "22222222-2222-4222-8222-222222222222", currentPrice: 949 });
  const flipkart = offer({ id: "33333333-3333-4333-8333-333333333333", currentPrice: 799, merchant: { name: "Flipkart", slug: "flipkart", logoUrl: null } });
  assert.equal(getBestEligibleOffer([amazon, amazonDuplicate, flipkart])?.merchant.name, "Flipkart");
  assert.equal(countEligibleStores([amazon, amazonDuplicate, flipkart]), 2);
});

test("no publication-eligible offer produces no top offer and zero stores", () => {
  const unavailable = offer({ availability: "out_of_stock" });
  assert.equal(getBestEligibleOffer([unavailable]), null);
  assert.equal(countEligibleStores([unavailable]), 0);
});

test("store cards retain tracked Buy Now links and omit unavailable checked-date copy", () => {
  const html = renderToStaticMarkup(createElement(PriceComparison, { offers: [offer()] }));
  assert.match(html, /href="\/go\/11111111-1111-4111-8111-111111111111"/);
  assert.match(html, /Buy now at Amazon/);
  assert.match(html, /01cada77a0a7d326d85b7969fe26a728\.jpg/);
  assert.match(html, /alt="Amazon logo"/);
  assert.doesNotMatch(html, /Checked date unavailable|date unavailable/i);
});

test("uploaded Amazon JPEG is preserved and only resolved for Amazon", () => {
  const logoPath = "public/merchants/01cada77a0a7d326d85b7969fe26a728.jpg";
  const logo = readFileSync(logoPath);
  assert.equal(createHash("sha256").update(logo).digest("hex"), "1be8de1fdce020eb4cdef475778512a783c70b08d517d21cf2268c5d00756732");
  assert.equal(getBundledMerchantLogo({ slug: "amazon" }), `/${logoPath.replaceAll("\\", "/").replace("public/", "")}`);
  assert.equal(getBundledMerchantLogo({ slug: "flipkart" }), null);
});

test("merchant logo falls back to a merchant initial without borrowing Amazon artwork", () => {
  const html = renderToStaticMarkup(createElement(MerchantLogo, { merchant: { name: "Flipkart", slug: "flipkart", logoUrl: null } }));
  assert.match(html, />F<\/span>/);
  assert.doesNotMatch(html, /01cada77a0a7d326d85b7969fe26a728/);
});

test("top summary uses tracked best-offer CTA, secondary compare, stores, and exact trust copy", () => {
  const source = readFileSync("app/products/[slug]/page.tsx", "utf8");
  assert.match(source, /href={`\/go\/\$\{bestOffer\.id\}`}/);
  assert.match(source, /Buy now on \{bestOffer\.merchant\.name\}/);
  assert.match(source, /<MerchantLogo merchant=\{bestOffer\.merchant\} variant="cta"/);
  assert.match(source, /availabilityLabel\(bestOffer\.availability\)/);
  assert.match(source, /Latest listed price\./);
  assert.match(source, /Final price and availability are confirmed on the store\./);
  assert.match(source, /product\.activeMerchantCount === 1 \? "store" : "stores"/);
  assert.ok(source.indexOf("Compare all") < source.indexOf("Buy now on"));
  assert.doesNotMatch(source, />Last updated</);
});
