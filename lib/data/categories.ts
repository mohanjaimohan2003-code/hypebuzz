export type CategoryLink = { label: string; href: string };
export type CategoryGroup = { label: string; href: string; items: readonly CategoryLink[] };
type TopCategory = CategoryLink & { accent?: boolean };
const href = (slug: string) => `/categories/${slug}`;

export const topCategories: readonly TopCategory[] = [
  { label: "Home", href: "/" }, { label: "Mobiles", href: href("mobiles") },
  { label: "Laptops", href: href("laptops") }, { label: "Electronics", href: href("electronics") },
  { label: "Audio", href: href("audio") }, { label: "Smartwatches", href: href("smartwatches") },
  { label: "Cameras", href: href("cameras") }, { label: "TVs", href: href("tvs") },
  { label: "Gaming", href: href("gaming") }, { label: "Home & Kitchen", href: href("home-kitchen") },
  { label: "Fashion", href: href("fashion") }, { label: "Beauty", href: href("beauty") },
  { label: "Sports", href: href("sports") }, { label: "Automotive", href: href("automotive") },
  { label: "Finance", href: href("finance") }, { label: "Travel", href: href("travel") },
  { label: "Trending", href: "/trending", accent: true },
];

const links = (entries: ReadonlyArray<readonly [string, string]>): CategoryLink[] =>
  entries.map(([label, slug]) => ({ label, href: href(slug) }));

export const categoryGroups: readonly CategoryGroup[] = [
  { label: "Electronics", href: href("electronics"), items: links([["Mobiles", "mobiles"], ["Laptops", "laptops"], ["Tablets", "tablets"], ["Monitors", "monitors"], ["Cameras", "cameras"], ["TVs", "tvs"], ["Printers", "printers"], ["Smart Home", "smart-home"]]) },
  { label: "Audio", href: href("audio"), items: links([["Earbuds", "earbuds"], ["Headphones", "headphones"], ["Speakers", "speakers"], ["Soundbars", "soundbars"]]) },
  { label: "Gaming", href: href("gaming"), items: links([["Gaming Laptops", "gaming-laptops"], ["Consoles", "consoles"], ["Controllers", "controllers"], ["Gaming Accessories", "gaming-accessories"]]) },
  { label: "Home & Kitchen", href: href("home-kitchen"), items: links([["Kitchen Appliances", "kitchen-appliances"], ["Home Appliances", "home-appliances"], ["Furniture", "furniture"], ["Cleaning", "cleaning"], ["Home Decor", "home-decor"]]) },
  { label: "Fashion", href: href("fashion"), items: links([["Men", "men"], ["Women", "women"], ["Kids", "kids"], ["Footwear", "footwear"], ["Watches", "watches"], ["Bags", "bags"]]) },
  { label: "Beauty", href: href("beauty"), items: links([["Skincare", "skincare"], ["Haircare", "haircare"], ["Makeup", "makeup"], ["Personal Care", "personal-care"]]) },
  { label: "Sports", href: href("sports"), items: links([["Fitness Equipment", "fitness-equipment"], ["Sportswear", "sportswear"], ["Outdoor", "outdoor"], ["Nutrition", "nutrition"]]) },
  { label: "Automotive", href: href("automotive"), items: links([["Car Accessories", "car-accessories"], ["Bike Accessories", "bike-accessories"], ["Car Care", "car-care"], ["Helmets", "helmets"]]) },
  { label: "Finance", href: href("finance"), items: links([["Credit Cards", "credit-cards"], ["Personal Loans", "personal-loans"], ["Home Loans", "home-loans"], ["Car Loans", "car-loans"], ["Insurance", "insurance"], ["Demat Accounts", "demat-accounts"], ["Savings Accounts", "savings-accounts"], ["Fixed Deposits", "fixed-deposits"], ["Cashback Offers", "cashback-offers"]]) },
  { label: "Travel", href: href("travel"), items: links([["Flights", "flights"], ["Hotels", "hotels"], ["Travel Packages", "travel-packages"], ["Luggage", "luggage"], ["Travel Accessories", "travel-accessories"]]) },
];
