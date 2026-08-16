"use client";

import type { PublicNavigationCategory } from "@/lib/data/public-category";
import { Navbar } from "./navbar";

export function HomepageHeaderClient({
  categories,
}: {
  categories: PublicNavigationCategory[];
}) {
  return <Navbar categories={categories} />;
}
