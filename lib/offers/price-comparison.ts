import {
  isOfferAvailability,
  isPublicationEligibleAvailability,
  offerAvailabilityValues,
  type OfferAvailability,
} from "@/lib/offers/publication-contract";

export { isOfferAvailability, offerAvailabilityValues, type OfferAvailability };

export function availabilityLabel(value: string | null) {
  const labels: Record<OfferAvailability, string> = {
    in_stock: "In stock",
    limited_stock: "Limited stock",
    out_of_stock: "Out of stock",
    pre_order: "Pre-order",
    unknown: "Availability unknown",
  };
  return value && isOfferAvailability(value) ? labels[value] : labels.unknown;
}

export function discountPercent(currentPrice: number, originalPrice: number | null) {
  if (!Number.isFinite(currentPrice) || !originalPrice || originalPrice <= currentPrice) return null;
  return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
}

export function savingsAmount(currentPrice: number, originalPrice: number | null) {
  return originalPrice && originalPrice > currentPrice ? originalPrice - currentPrice : null;
}

export function isEligiblePrice(offer: { currentPrice: number; availability: string | null }) {
  return Number.isFinite(offer.currentPrice)
    && offer.currentPrice > 0
    && isPublicationEligibleAvailability(offer.availability);
}

export function sortPublicOffers<T extends { currentPrice: number; availability: string | null }>(offers: T[]) {
  return [...offers].sort((left, right) => {
    const leftEligible = isEligiblePrice(left);
    const rightEligible = isEligiblePrice(right);
    if (leftEligible !== rightEligible) return leftEligible ? -1 : 1;
    return left.currentPrice - right.currentPrice;
  });
}
