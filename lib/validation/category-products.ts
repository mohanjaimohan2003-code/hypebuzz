import {
  parseProductSearchParams,
  type ProductSearchParams,
} from "@/lib/validation/product-search";

type RawSearchParams = Record<string, string | string[] | undefined>;

export type CategoryProductParams = ProductSearchParams & {
  featured: boolean;
  trending: boolean;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function parseCategoryProductParams(
  raw: RawSearchParams,
): CategoryProductParams {
  return {
    ...parseProductSearchParams(raw),
    category: "",
    featured: first(raw.featured) === "1",
    trending: first(raw.trending) === "1",
  };
}

export function hasCategoryFilters(filters: CategoryProductParams) {
  return Boolean(
    filters.q ||
      filters.brand ||
      filters.merchant ||
      filters.minPrice !== null ||
      filters.maxPrice !== null ||
      filters.minDiscount !== null ||
      filters.availability ||
      filters.bestPriceOnly ||
      filters.featured ||
      filters.trending ||
      filters.sort !== "relevance",
  );
}
