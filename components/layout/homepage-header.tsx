import { getPublicNavigationCategories } from "@/lib/data/public-category";
import { HomepageHeaderClient } from "./homepage-header-client";

export async function HomepageHeader() {
  const categories = await getPublicNavigationCategories();
  return <HomepageHeaderClient categories={categories} />;
}
