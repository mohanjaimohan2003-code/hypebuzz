export type ProductSlugRecord = { id: string; name: string; slug: string; status: string };

export function normalizeProductIdentity(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function matchingProductForCreate<T extends ProductSlugRecord>(productName: string, products: T[]): T | null {
  const identity = normalizeProductIdentity(productName);
  return products.find((product) => normalizeProductIdentity(product.name) === identity) ?? null;
}

export function nextAvailableProductSlug(requestedSlug: string, occupiedSlugs: Iterable<string>) {
  const occupied = new Set(occupiedSlugs);
  if (!occupied.has(requestedSlug)) return requestedSlug;
  let suffix = 2;
  while (occupied.has(`${requestedSlug}-${suffix}`)) suffix += 1;
  return `${requestedSlug}-${suffix}`;
}
