import assert from "node:assert/strict";
import test from "node:test";
import {
  isOfferEligibleForPublication,
  offerAvailabilityValues,
  publicationEligibleAvailabilityValues,
  publicationReadiness,
  schemaAvailability,
  validateOfferContract,
  type OfferContractInput,
} from "../lib/offers/publication-contract";
import { validateOfferForm } from "../lib/validation/offer";
import { validateProductForm } from "../lib/validation/product";

const productId = "11111111-1111-4111-8111-111111111111";
const merchantId = "22222222-2222-4222-8222-222222222222";
const categoryId = "33333333-3333-4333-8333-333333333333";
const offerId = "44444444-4444-4444-8444-444444444444";

function validOffer(overrides: Partial<OfferContractInput> = {}): OfferContractInput {
  return {
    affiliateUrl: "https://merchant.example/product?tag=hypebuzz",
    currentPrice: 999,
    originalPrice: null,
    currency: "INR",
    availability: "in_stock",
    isActive: true,
    merchantIsActive: true,
    ...overrides,
  };
}

function offerForm(overrides: Record<string, string> = {}) {
  const form = new FormData();
  const values = {
    productId,
    merchantId,
    affiliateUrl: "https://merchant.example/product",
    currentPrice: "999",
    originalPrice: "",
    currency: "INR",
    stockStatus: "in_stock",
    isActive: "on",
    notes: "",
    shippingNote: "",
    offerTitle: "",
    lastCheckedAt: "",
    ...overrides,
  };
  for (const [key, value] of Object.entries(values)) form.set(key, value);
  return form;
}

function productForm(status: "draft" | "published", offers: unknown[]) {
  const form = new FormData();
  form.set("name", "Test phone");
  form.set("slug", "test-phone");
  form.set("categoryId", categoryId);
  form.set("status", status);
  form.set("imageManifest", "[]");
  form.set("offerManifest", JSON.stringify(offers));
  return form;
}

function manifestOffer(overrides: Record<string, unknown> = {}) {
  return {
    id: offerId,
    merchantId,
    affiliateUrl: "https://merchant.example/product",
    currentPrice: 999,
    originalPrice: null,
    currency: "INR",
    stockStatus: "in_stock",
    isActive: true,
    couponCode: "",
    shippingNote: "",
    offerTitle: "",
    lastCheckedAt: "",
    ...overrides,
  };
}

test("draft without an offer is valid", () => {
  assert.equal(validateProductForm(productForm("draft", [])).success, true);
  assert.deepEqual(publicationReadiness({ status: "draft", categoryIsActive: false, offers: [] }), []);
});

test("published product without an offer is invalid", () => {
  const result = validateProductForm(productForm("published", []));
  assert.equal(result.success, false);
  assert.deepEqual(publicationReadiness({ status: "published", categoryIsActive: true, offers: [] }), ["PRODUCT_OFFER_REQUIRED"]);
});

test("published product requires an active category", () => {
  assert.deepEqual(publicationReadiness({ status: "published", categoryIsActive: false, offers: [validOffer()] }), ["PRODUCT_CATEGORY_INACTIVE"]);
});

test("inactive merchant cannot support publication", () => {
  assert.equal(isOfferEligibleForPublication(validOffer({ merchantIsActive: false })), false);
});

test("inactive offer cannot support publication", () => {
  assert.equal(isOfferEligibleForPublication(validOffer({ isActive: false })), false);
});

test("invalid affiliate URLs are rejected", () => {
  assert.ok(validateOfferContract(validOffer({ affiliateUrl: "javascript:alert(1)" })).includes("OFFER_URL_INVALID"));
});

test("zero and negative current prices are rejected", () => {
  assert.ok(validateOfferContract(validOffer({ currentPrice: 0 })).includes("OFFER_CURRENT_PRICE_INVALID"));
  assert.ok(validateOfferContract(validOffer({ currentPrice: -1 })).includes("OFFER_CURRENT_PRICE_INVALID"));
});

test("null original price is valid", () => {
  assert.deepEqual(validateOfferContract(validOffer({ originalPrice: null })), []);
  assert.equal(isOfferEligibleForPublication(validOffer({ originalPrice: null })), true);
});

test("original price below current price is rejected", () => {
  assert.ok(validateOfferContract(validOffer({ currentPrice: 100, originalPrice: 99 })).includes("OFFER_ORIGINAL_PRICE_INVALID"));
});

test("every supported availability has the documented publication semantics", () => {
  const eligible = new Set(publicationEligibleAvailabilityValues);
  for (const availability of offerAvailabilityValues) {
    assert.deepEqual(validateOfferContract(validOffer({ availability })), []);
    assert.equal(isOfferEligibleForPublication(validOffer({ availability })), eligible.has(availability as never));
  }
});

test("unsupported availability is rejected", () => {
  assert.ok(validateOfferContract(validOffer({ availability: "back_order" })).includes("OFFER_AVAILABILITY_INVALID"));
});

test("public eligibility and publication readiness use the same predicate", () => {
  const cases = [
    validOffer(),
    validOffer({ availability: "out_of_stock" }),
    validOffer({ originalPrice: 500 }),
    validOffer({ merchantIsActive: false }),
  ];
  for (const offer of cases) {
    const ready = publicationReadiness({ status: "published", categoryIsActive: true, offers: [offer] }).length === 0;
    assert.equal(ready, isOfferEligibleForPublication(offer));
  }
});

test("standalone and embedded offer validation reject the same contract violations", () => {
  const standalone = validateOfferForm(offerForm({ originalPrice: "500" }));
  const embedded = validateProductForm(productForm("draft", [manifestOffer({ originalPrice: 500 })]));
  assert.equal(standalone.success, false);
  assert.equal(embedded.success, false);
  if (!standalone.success && !embedded.success) {
    assert.match(standalone.state.fieldErrors.originalPrice ?? "", /Original price/);
    assert.match(embedded.state.fieldErrors.offerList ?? "", /Original price/);
  }
});

test("structured-data mapping preserves availability semantics", () => {
  assert.equal(schemaAvailability("in_stock"), "https://schema.org/InStock");
  assert.equal(schemaAvailability("limited_stock"), "https://schema.org/LimitedAvailability");
  assert.equal(schemaAvailability("pre_order"), "https://schema.org/PreOrder");
  assert.equal(schemaAvailability("out_of_stock"), "https://schema.org/OutOfStock");
  assert.equal(schemaAvailability("unknown"), "https://schema.org/OutOfStock");
  assert.equal(schemaAvailability(null), "https://schema.org/OutOfStock");
});
