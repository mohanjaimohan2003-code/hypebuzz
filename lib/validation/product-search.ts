export const SEARCH_SORTS = [
  "relevance",
  "price_low",
  "price_high",
  "discount",
  "newest",
  "popular",
] as const;

export const SEARCH_AVAILABILITY = [
  "In Stock",
  "Limited Stock",
  "Out of Stock",
] as const;

export type ProductSearchSort = (typeof SEARCH_SORTS)[number];
export type ProductSearchAvailability = (typeof SEARCH_AVAILABILITY)[number];

export type ProductSearchParams = {
  q: string;
  category: string;
  brand: string;
  merchant: string;
  minPrice: number | null;
  maxPrice: number | null;
  minDiscount: number | null;
  availability: ProductSearchAvailability | null;
  bestPriceOnly: boolean;
  sort: ProductSearchSort;
};

type RawSearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function cleanText(value: string | string[] | undefined, maxLength = 100) {
  return (first(value) ?? "").trim().slice(0, maxLength);
}

function cleanSlug(value: string | string[] | undefined) {
  const candidate = cleanText(value);
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(candidate) ? candidate : "";
}

function cleanNumber(
  value: string | string[] | undefined,
  maximum: number,
) {
  const candidate = first(value);
  if (!candidate?.trim()) return null;
  const number = Number(candidate);
  return Number.isFinite(number) && number >= 0
    ? Math.min(number, maximum)
    : null;
}

export function parseProductSearchParams(
  raw: RawSearchParams,
): ProductSearchParams {
  const requestedSort = first(raw.sort);
  const requestedAvailability = first(raw.availability);
  const minPrice = cleanNumber(raw.min_price, 100_000_000);
  const maxPrice = cleanNumber(raw.max_price, 100_000_000);

  return {
    q: cleanText(raw.q),
    category: cleanSlug(raw.category),
    brand: cleanSlug(raw.brand),
    merchant: cleanSlug(raw.merchant),
    minPrice,
    maxPrice:
      minPrice !== null && maxPrice !== null && maxPrice < minPrice
        ? minPrice
        : maxPrice,
    minDiscount: cleanNumber(raw.discount, 100),
    availability: SEARCH_AVAILABILITY.includes(
      requestedAvailability as ProductSearchAvailability,
    )
      ? (requestedAvailability as ProductSearchAvailability)
      : null,
    bestPriceOnly: first(raw.best) === "1",
    sort: SEARCH_SORTS.includes(requestedSort as ProductSearchSort)
      ? (requestedSort as ProductSearchSort)
      : "relevance",
  };
}

