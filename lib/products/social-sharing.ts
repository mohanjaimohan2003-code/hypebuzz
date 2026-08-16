import { absoluteUrl, siteSocialImagePath } from "@/lib/seo/site";

type ProductSocialSource = {
  name: string;
  slug: string;
  seoTitle: string | null;
  seoDescription: string | null;
  shortDescription: string | null;
  description: string | null;
  imageUrl: string | null;
  images: Array<{ imageUrl: string }>;
};

const maxSocialDescriptionLength = 180;

function concise(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxSocialDescriptionLength) return normalized;
  const shortened = normalized.slice(0, maxSocialDescriptionLength - 1);
  const lastSpace = shortened.lastIndexOf(" ");
  return `${shortened.slice(0, lastSpace > 120 ? lastSpace : shortened.length).trimEnd()}…`;
}

export function publicHttpsUrl(value: string | null | undefined) {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value, absoluteUrl("/"));
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function productSocialDetails(product: ProductSocialSource) {
  const canonicalUrl = absoluteUrl(`/products/${product.slug}`);
  const descriptionSource = [product.seoDescription, product.shortDescription, product.description]
    .map((value) => value?.replace(/\s+/g, " ").trim())
    .find((value) => value && value.toLocaleLowerCase() !== product.name.trim().toLocaleLowerCase())
    || `View ${product.name} on HypeBuzz.`;
  const primaryImage = product.images[0]?.imageUrl ?? product.imageUrl;

  return {
    title: product.name,
    description: concise(descriptionSource),
    imageUrl: publicHttpsUrl(primaryImage) ?? absoluteUrl(siteSocialImagePath),
    canonicalUrl,
  };
}
