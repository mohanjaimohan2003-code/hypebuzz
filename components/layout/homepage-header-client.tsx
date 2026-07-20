"use client";

import { useCallback, useState } from "react";
import { LiveMarketBar } from "@/components/market/live-market-bar";
import type { PublicNavigationCategory } from "@/lib/data/public-category";
import { Navbar } from "./navbar";

export function HomepageHeaderClient({ categories }: { categories: PublicNavigationCategory[] }) {
  const [isSearchActive, setIsSearchActive] = useState(false);
  const handleSearchActivityChange = useCallback((active: boolean) => {
    setIsSearchActive(active);
  }, []);

  return (
    <>
      {isSearchActive ? null : <LiveMarketBar />}
      <Navbar categories={categories} onSearchActivityChange={handleSearchActivityChange} />
    </>
  );
}
