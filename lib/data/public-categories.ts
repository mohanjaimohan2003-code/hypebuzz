export type PublicCategoryDefinition = {
  name: string;
  slug: string;
  description: string;
  displayOrder: number;
};

export const publicCategories = [
  { name: "Mobiles", slug: "mobiles", description: "Compare smartphones, prices, specifications, and active offers.", displayOrder: 1 },
  { name: "Laptops", slug: "laptops", description: "Explore laptops for work, study, gaming, and everyday use.", displayOrder: 2 },
  { name: "Electronics", slug: "electronics", description: "Discover useful electronics, current prices, and active offers.", displayOrder: 3 },
  { name: "Audio", slug: "audio", description: "Compare headphones, earbuds, speakers, soundbars, and audio deals.", displayOrder: 4 },
  { name: "Smartwatches", slug: "smartwatches", description: "Explore smartwatches, fitness features, prices, and offers.", displayOrder: 5 },
  { name: "Cameras", slug: "cameras", description: "Compare cameras, photography equipment, specifications, and prices.", displayOrder: 6 },
  { name: "TVs", slug: "tvs", description: "Compare televisions, display features, sizes, prices, and active offers.", displayOrder: 7 },
  { name: "Gaming", slug: "gaming", description: "Explore gaming hardware, accessories, prices, and current deals.", displayOrder: 8 },
  { name: "Home & Kitchen", slug: "home-kitchen", description: "Discover home and kitchen products, prices, and active offers.", displayOrder: 9 },
  { name: "Fashion", slug: "fashion", description: "Explore fashion products, everyday essentials, and current offers.", displayOrder: 10 },
  { name: "Beauty", slug: "beauty", description: "Discover beauty and personal-care products, prices, and offers.", displayOrder: 11 },
  { name: "Sports", slug: "sports", description: "Compare sports, fitness, and outdoor products and active offers.", displayOrder: 12 },
  { name: "Automotive", slug: "automotive", description: "Explore automotive accessories, care products, and current prices.", displayOrder: 13 },
  { name: "Finance", slug: "finance", description: "Explore curated financial products, services, and available offers.", displayOrder: 14 },
  { name: "Travel", slug: "travel", description: "Discover travel products, services, accessories, and active offers.", displayOrder: 15 },
] as const satisfies readonly PublicCategoryDefinition[];

const categoriesBySlug = new Map<string, PublicCategoryDefinition>(
  publicCategories.map((category) => [category.slug, category]),
);

export function getPublicCategoryDefinition(slug: string) {
  return categoriesBySlug.get(slug) ?? null;
}
