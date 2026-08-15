"use client";

import Link from "next/link";
import { useEffect, useRef, type KeyboardEvent, type MouseEvent } from "react";
import type { SearchFilterOption } from "@/lib/data/product-search";
import type { ProductSearchParams } from "@/lib/validation/product-search";

type Props = {
  filters: ProductSearchParams & { featured?: boolean; trending?: boolean };
  categories: SearchFilterOption[];
  brands: SearchFilterOption[];
  merchants: SearchFilterOption[];
  action?: string;
  resetHref?: string;
  hideCategory?: boolean;
  showEditorialFilters?: boolean;
};

const inputClass = "min-h-11 w-full rounded-[10px] border border-[#D1D5DB] bg-white px-3 text-sm text-[#111827] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]";
const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2";
const summaryClass = `flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-[10px] border border-[#D1D5DB] bg-white px-3 text-sm font-semibold text-[#111827] hover:border-[#2563EB] [&::-webkit-details-marker]:hidden ${focusRing}`;

function PriceFields({ filters }: Pick<Props, "filters">) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-[#111827]">Best price range</legend>
      <p className="mt-1 text-xs leading-5 text-[#6B7280]">Based on each product&apos;s lowest active offer.</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="text-xs font-medium text-[#6B7280]">Minimum
          <input className={`mt-1 ${inputClass}`} defaultValue={filters.minPrice ?? ""} inputMode="decimal" min="0" name="min_price" placeholder="₹0" type="number" />
        </label>
        <label className="text-xs font-medium text-[#6B7280]">Maximum
          <input className={`mt-1 ${inputClass}`} defaultValue={filters.maxPrice ?? ""} inputMode="decimal" min="0" name="max_price" placeholder="Any" type="number" />
        </label>
      </div>
    </fieldset>
  );
}

function SecondaryFields({ filters, categories, hideCategory, showEditorialFilters }: Props) {
  return (
    <div className="space-y-4">
      {!hideCategory ? <label className="block text-sm font-semibold text-[#111827]">Category
        <select className={`mt-2 ${inputClass}`} defaultValue={filters.category} name="category">
          <option value="">All categories</option>
          {categories.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
        </select>
      </label> : null}
      <label className="block text-sm font-semibold text-[#111827]">Availability
        <select className={`mt-2 ${inputClass}`} defaultValue={filters.availability ?? ""} name="availability">
          <option value="">Any availability</option><option>In Stock</option><option>Limited Stock</option><option>Out of Stock</option>
        </select>
      </label>
      <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[10px] border border-[#E5E7EB] px-3 text-sm font-semibold text-[#111827]">
        <input className="h-5 w-5 accent-[#2563EB]" defaultChecked={filters.bestPriceOnly} name="best" type="checkbox" value="1" />
        Compared best prices
      </label>
      {showEditorialFilters ? <div className="space-y-2">
        <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[10px] border border-[#E5E7EB] px-3 text-sm font-semibold text-[#111827]">
          <input className="h-5 w-5 accent-[#2563EB]" defaultChecked={filters.featured} name="featured" type="checkbox" value="1" />
          Featured products
        </label>
        <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[10px] border border-[#E5E7EB] px-3 text-sm font-semibold text-[#111827]">
          <input className="h-5 w-5 accent-[#2563EB]" defaultChecked={filters.trending} name="trending" type="checkbox" value="1" />
          Trending products
        </label>
      </div> : null}
      <label className="block text-sm font-semibold text-[#111827]">Sort by
        <select className={`mt-2 ${inputClass}`} defaultValue={filters.sort} name="sort">
          <option value="relevance">Relevance</option><option value="price_low">Lowest price</option><option value="price_high">Highest price</option><option value="discount">Biggest discount</option><option value="newest">Newest</option><option value="popular">Most popular (coming soon)</option>
        </select>
      </label>
    </div>
  );
}

export function SearchFilters(props: Props) {
  const containerRef = useRef<HTMLFormElement>(null);
  const priceRef = useRef<HTMLDetailsElement>(null);
  const moreRef = useRef<HTMLDetailsElement>(null);
  const priceSummaryRef = useRef<HTMLElement>(null);
  const moreSummaryRef = useRef<HTMLElement>(null);
  const action = props.action ?? "/search";
  const resetHref = props.resetHref ?? "/search";
  const moreActiveCount = [props.hideCategory ? null : props.filters.category, props.filters.availability, props.filters.bestPriceOnly, props.filters.featured, props.filters.trending, props.filters.sort !== "relevance"].filter(Boolean).length;
  const priceLabel = props.filters.minPrice !== null || props.filters.maxPrice !== null
    ? `Price (${props.filters.minPrice ?? "0"}–${props.filters.maxPrice ?? "Any"})`
    : "Price";

  useEffect(() => {
    function closePanels(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        if (priceRef.current) priceRef.current.open = false;
        if (moreRef.current) moreRef.current.open = false;
      }
    }
    document.addEventListener("pointerdown", closePanels);
    return () => document.removeEventListener("pointerdown", closePanels);
  }, []);

  function handleEscape(event: KeyboardEvent<HTMLFormElement>) {
    if (event.key !== "Escape") return;
    if (priceRef.current?.open) {
      event.preventDefault();
      priceRef.current.open = false;
      priceSummaryRef.current?.focus();
    } else if (moreRef.current?.open) {
      event.preventDefault();
      moreRef.current.open = false;
      moreSummaryRef.current?.focus();
    }
  }

  function closeOtherPanel(event: MouseEvent<HTMLElement>, panel: "price" | "more") {
    if (event.currentTarget.closest("details")?.hasAttribute("open")) return;
    if (panel === "price" && moreRef.current) moreRef.current.open = false;
    if (panel === "more" && priceRef.current) priceRef.current.open = false;
  }

  return (
    <form ref={containerRef} action={action} aria-label="Product filters" className="relative rounded-2xl border border-[#E5E7EB] bg-white p-4" method="get" onKeyDown={handleEscape}>
      <input name="q" type="hidden" value={props.filters.q} />
      <div className="flex flex-wrap items-end gap-3">
        <label className="min-w-[9rem] flex-1 sm:max-w-[13rem]"><span className="sr-only">Brand</span>
          <select aria-label="Brand" className={inputClass} defaultValue={props.filters.brand} name="brand"><option value="">All brands</option>{props.brands.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select>
        </label>
        <label className="min-w-[9rem] flex-1 sm:max-w-[13rem]"><span className="sr-only">Merchant</span>
          <select aria-label="Merchant" className={inputClass} defaultValue={props.filters.merchant} name="merchant"><option value="">All merchants</option>{props.merchants.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select>
        </label>
        <details ref={priceRef} className="relative w-full sm:w-auto">
          <summary ref={priceSummaryRef} className={summaryClass} onClick={(event) => closeOtherPanel(event, "price")}>{priceLabel}<span aria-hidden="true">⌄</span></summary>
          <div className="absolute inset-x-0 z-30 mt-2 rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-xl sm:left-0 sm:right-auto sm:w-80"><PriceFields filters={props.filters} /></div>
        </details>
        <label className="min-w-[10rem] flex-1 sm:max-w-[13rem]"><span className="sr-only">Minimum discount</span>
          <select aria-label="Minimum discount" className={inputClass} defaultValue={props.filters.minDiscount ?? ""} name="discount"><option value="">Any discount</option><option value="10">10% or more</option><option value="25">25% or more</option><option value="50">50% or more</option></select>
        </label>
        <details ref={moreRef} className="relative w-full sm:w-auto">
          <summary ref={moreSummaryRef} className={summaryClass} onClick={(event) => closeOtherPanel(event, "more")}>More Filters{moreActiveCount ? ` (${moreActiveCount})` : ""}<span aria-hidden="true">⌄</span></summary>
          <div className="absolute inset-x-0 z-30 mt-2 rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-xl sm:left-0 sm:right-auto sm:w-80"><SecondaryFields {...props} /></div>
        </details>
        <button className={`min-h-11 rounded-[10px] bg-[#2563EB] px-4 text-sm font-bold text-white hover:bg-[#1D4ED8] ${focusRing}`} type="submit">Apply filters</button>
        <Link className={`flex min-h-11 items-center justify-center rounded-[10px] border border-[#D1D5DB] bg-white px-4 text-sm font-semibold text-[#111827] hover:bg-[#F8FAFC] ${focusRing}`} href={resetHref}>Reset</Link>
      </div>
    </form>
  );
}
