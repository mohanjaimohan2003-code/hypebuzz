"use client";

import { useState } from "react";
import type { PublicReview, ReviewRatingFilter, ReviewSort, ReviewSummary } from "@/lib/reviews/model";
import { ProductReviews } from "./product-reviews";
import { ProductDescription, ProductSpecifications } from "./product-rich-content";

type TabId = "about" | "specifications" | "reviews";
const tabs: Array<{ id: TabId; label: string }> = [
  { id: "about", label: "About" },
  { id: "specifications", label: "Specifications" },
  { id: "reviews", label: "Reviews" },
];

type Props = {
  description: string | null;
  specifications: Array<{ name: string; value: string }>;
  initialTab?: TabId;
  reviewData: {
    slug: string;
    summary: ReviewSummary;
    reviews: PublicReview[];
    rating: ReviewRatingFilter;
    sort: ReviewSort;
    limit: number;
    hasMore: boolean;
    hasError: boolean;
  };
};

export function ProductInformationTabs({ description, specifications, reviewData, initialTab = "about" }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);

  function activate(index: number) {
    const tab = tabs[(index + tabs.length) % tabs.length];
    setActiveTab(tab.id);
    document.getElementById(`product-tab-${tab.id}`)?.focus();
  }

  return <section aria-label="Product information" className="mt-8" id="product-information-tabs">
    <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white">
      <div aria-label="Product information" className="grid grid-cols-3 border-b border-[#E5E7EB]" role="tablist">
        {tabs.map((tab, index) => <button aria-controls={`product-panel-${tab.id}`} aria-selected={activeTab === tab.id} className={`min-h-12 border-b-2 px-2 text-sm font-bold transition-colors focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2563EB] sm:px-5 ${activeTab === tab.id ? "border-[#2563EB] bg-[#EFF6FF] text-[#1D4ED8]" : "border-transparent text-[#6B7280] hover:bg-[#F8FAFC] hover:text-[#111827]"}`} id={`product-tab-${tab.id}`} key={tab.id} onClick={() => setActiveTab(tab.id)} onKeyDown={(event) => {
          if (event.key === "ArrowRight") { event.preventDefault(); activate(index + 1); }
          if (event.key === "ArrowLeft") { event.preventDefault(); activate(index - 1); }
          if (event.key === "Home") { event.preventDefault(); activate(0); }
          if (event.key === "End") { event.preventDefault(); activate(tabs.length - 1); }
        }} role="tab" tabIndex={activeTab === tab.id ? 0 : -1} type="button">{tab.label}</button>)}
      </div>
      <div aria-labelledby={`product-tab-${activeTab}`} className="p-5 sm:p-6" id={`product-panel-${activeTab}`} role="tabpanel" tabIndex={0}>
        {activeTab === "about" ? <ProductDescription description={description} /> : null}
        {activeTab === "specifications" ? <ProductSpecifications specifications={specifications} /> : null}
        {activeTab === "reviews" ? <ProductReviews {...reviewData} /> : null}
      </div>
    </div>
  </section>;
}
