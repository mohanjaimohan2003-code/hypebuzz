export function productSeoCopy(product: {
  name: string;
  brand: { name: string } | null;
  seoTitle: string | null;
  seoDescription: string | null;
  shortDescription: string | null;
  description: string | null;
}) {
  const fallbackTitle = product.brand
    ? `${product.name} by ${product.brand.name} prices and offers`
    : `${product.name} prices and offers`;
  return {
    title: product.seoTitle?.trim() || fallbackTitle,
    description: product.seoDescription?.trim()
      || product.shortDescription?.trim()
      || product.description?.trim()
      || `Compare current prices and offers for ${product.name}.`,
  };
}
