export const offerAvailabilityValues = [
  "in_stock",
  "limited_stock",
  "out_of_stock",
  "pre_order",
  "unknown",
] as const;

export type OfferAvailability = (typeof offerAvailabilityValues)[number];

export const publicationEligibleAvailabilityValues = [
  "in_stock",
  "limited_stock",
  "pre_order",
] as const satisfies readonly OfferAvailability[];

const publicationEligibleAvailability = new Set<OfferAvailability>(
  publicationEligibleAvailabilityValues,
);

export const publicationErrorMessages = {
  PRODUCT_CATEGORY_INACTIVE: "Published products require an active category.",
  PRODUCT_OFFER_REQUIRED: "Published products require at least one eligible active offer.",
  OFFER_MERCHANT_INACTIVE: "Active offers require an active merchant.",
  OFFER_URL_INVALID: "Enter a complete HTTP or HTTPS affiliate URL within 2,048 characters.",
  OFFER_CURRENT_PRICE_INVALID: "Enter a current price greater than zero with up to two decimals.",
  OFFER_ORIGINAL_PRICE_INVALID: "Original price must be greater than zero and cannot be lower than the current price.",
  OFFER_CURRENCY_INVALID: "Use a three-letter uppercase currency code such as INR.",
  OFFER_AVAILABILITY_INVALID: "Select a supported availability.",
} as const;

export type PublicationErrorCode = keyof typeof publicationErrorMessages;

export type OfferContractInput = {
  affiliateUrl: string;
  currentPrice: number | null;
  originalPrice: number | null;
  currency: string;
  availability: string | null;
  isActive: boolean;
  merchantIsActive: boolean;
};

export function isOfferAvailability(value: string): value is OfferAvailability {
  return offerAvailabilityValues.includes(value as OfferAvailability);
}

export function isPublicationEligibleAvailability(
  value: string | null,
): value is (typeof publicationEligibleAvailabilityValues)[number] {
  return value !== null
    && isOfferAvailability(value)
    && publicationEligibleAvailability.has(value);
}

export function isValidAffiliateUrl(value: string) {
  if (!value || value.length > 2048) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function validateOfferContract(
  offer: OfferContractInput,
  options: { requireActiveMerchant?: boolean } = {},
): PublicationErrorCode[] {
  const errors: PublicationErrorCode[] = [];
  if (!isValidAffiliateUrl(offer.affiliateUrl)) errors.push("OFFER_URL_INVALID");
  if (offer.currentPrice === null || !Number.isFinite(offer.currentPrice) || offer.currentPrice <= 0) {
    errors.push("OFFER_CURRENT_PRICE_INVALID");
  }
  if (offer.originalPrice !== null && (
    !Number.isFinite(offer.originalPrice)
    || offer.originalPrice <= 0
    || (offer.currentPrice !== null && offer.originalPrice < offer.currentPrice)
  )) errors.push("OFFER_ORIGINAL_PRICE_INVALID");
  if (!/^[A-Z]{3}$/.test(offer.currency)) errors.push("OFFER_CURRENCY_INVALID");
  if (offer.availability === null || !isOfferAvailability(offer.availability)) {
    errors.push("OFFER_AVAILABILITY_INVALID");
  }
  if ((options.requireActiveMerchant || offer.isActive) && !offer.merchantIsActive) {
    errors.push("OFFER_MERCHANT_INACTIVE");
  }
  return errors;
}

export function isOfferEligibleForPublication(offer: OfferContractInput) {
  return offer.isActive
    && offer.merchantIsActive
    && validateOfferContract(offer).length === 0
    && isPublicationEligibleAvailability(offer.availability);
}

export type DatabaseOfferContractInput = {
  affiliate_url: string;
  current_price: number;
  original_price?: number | null;
  currency: string;
  availability: string | null;
  is_active: boolean;
  merchant: { is_active: boolean } | null;
};

export function isDatabaseOfferEligibleForPublication(
  offer: DatabaseOfferContractInput,
) {
  return isOfferEligibleForPublication(toOfferContractInput(offer));
}

function toOfferContractInput(offer: DatabaseOfferContractInput): OfferContractInput {
  return {
    affiliateUrl: offer.affiliate_url,
    currentPrice: Number(offer.current_price),
    originalPrice: offer.original_price === null || offer.original_price === undefined
      ? null
      : Number(offer.original_price),
    currency: offer.currency,
    availability: offer.availability,
    isActive: offer.is_active,
    merchantIsActive: offer.merchant?.is_active === true,
  };
}

export function isDatabaseOfferPubliclyVisible(offer: DatabaseOfferContractInput) {
  const input = toOfferContractInput(offer);
  return input.isActive
    && input.merchantIsActive
    && validateOfferContract(input).length === 0;
}

export function publicationReadiness(input: {
  status: "draft" | "published" | "archived";
  categoryIsActive: boolean;
  offers: OfferContractInput[];
}): PublicationErrorCode[] {
  if (input.status !== "published") return [];
  const errors: PublicationErrorCode[] = [];
  if (!input.categoryIsActive) errors.push("PRODUCT_CATEGORY_INACTIVE");
  if (!input.offers.some(isOfferEligibleForPublication)) errors.push("PRODUCT_OFFER_REQUIRED");
  return errors;
}

export function schemaAvailability(value: string | null) {
  const mapping: Record<OfferAvailability, string> = {
    in_stock: "https://schema.org/InStock",
    limited_stock: "https://schema.org/LimitedAvailability",
    out_of_stock: "https://schema.org/OutOfStock",
    pre_order: "https://schema.org/PreOrder",
    unknown: "https://schema.org/OutOfStock",
  };
  return value && isOfferAvailability(value)
    ? mapping[value]
    : mapping.unknown;
}
