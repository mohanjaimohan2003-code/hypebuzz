"use client";

import Link from "next/link";
import { useRef, type MouseEvent } from "react";
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

function FilterFields({ filters, categories, brands, merchants, hideCategory, showEditorialFilters }: Props) {
  return (
    <div className="space-y-5">
      <input name="q" type="hidden" value={filters.q} />
      {!hideCategory ? <label className="block text-sm font-semibold text-[#111827]">Category
        <select className={`mt-2 ${inputClass}`} defaultValue={filters.category} name="category">
          <option value="">All categories</option>
          {categories.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
        </select>
      </label> : null}
      <label className="block text-sm font-semibold text-[#111827]">Brand
        <select className={`mt-2 ${inputClass}`} defaultValue={filters.brand} name="brand">
          <option value="">All brands</option>
          {brands.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
        </select>
      </label>
      <label className="block text-sm font-semibold text-[#111827]">Merchant
        <select className={`mt-2 ${inputClass}`} defaultValue={filters.merchant} name="merchant">
          <option value="">All merchants</option>
          {merchants.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
        </select>
      </label>
      <fieldset>
        <legend className="text-sm font-semibold text-[#111827]">Best price range</legend>
        <p className="mt-1 text-xs leading-5 text-[#6B7280]">Based on each product&apos;s lowest active offer.</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <label className="text-xs font-medium text-[#6B7280]">Minimum
            <input className={`mt-1 ${inputClass}`} defaultValue={filters.minPrice ?? ""} inputMode="decimal" min="0" name="min_price" placeholder="₹0" type="number" />
          </label>
          <label className="text-xs font-medium text-[#6B7280]">Maximum
            <input className={`mt-1 ${inputClass}`} defaultValue={filters.maxPrice ?? ""} inputMode="decimal" min="0" name="max_price" placeholder="Any" type="number" />
          </label>
        </div>
      </fieldset>
      <label className="block text-sm font-semibold text-[#111827]">Minimum discount
        <select className={`mt-2 ${inputClass}`} defaultValue={filters.minDiscount ?? ""} name="discount">
          <option value="">Any discount</option>
          <option value="10">10% or more</option><option value="25">25% or more</option><option value="50">50% or more</option>
        </select>
      </label>
      <label className="block text-sm font-semibold text-[#111827]">Availability
        <select className={`mt-2 ${inputClass}`} defaultValue={filters.availability ?? ""} name="availability">
          <option value="">Any availability</option><option>In Stock</option><option>Limited Stock</option><option>Out of Stock</option>
        </select>
      </label>
      <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[10px] border border-[#E5E7EB] px-3 text-sm font-semibold text-[#111827]">
        <input className="h-5 w-5 accent-[#2563EB]" defaultChecked={filters.bestPriceOnly} name="best" type="checkbox" value="1" />
        Compared best prices
      </label>
      <p className="-mt-4 text-xs leading-5 text-[#6B7280]">Show products compared across at least two stores.</p>
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

function Actions({ onApply, resetHref }: { onApply?: () => void; resetHref: string }) {
  return (
    <div className="mt-6 grid grid-cols-2 gap-3">
      <Link className={`flex min-h-11 items-center justify-center rounded-[10px] border border-[#D1D5DB] bg-white px-3 text-sm font-semibold text-[#111827] hover:bg-[#F8FAFC] ${focusRing}`} href={resetHref}>Reset</Link>
      <button className={`min-h-11 rounded-[10px] bg-[#2563EB] px-3 text-sm font-bold text-white hover:bg-[#1D4ED8] ${focusRing}`} onClick={onApply} type="submit">Apply filters</button>
    </div>
  );
}

export function SearchFilters(props: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const action = props.action ?? "/search";
  const resetHref = props.resetHref ?? "/search";
  const activeCount = [props.hideCategory ? null : props.filters.category, props.filters.brand, props.filters.merchant, props.filters.minPrice, props.filters.maxPrice, props.filters.minDiscount, props.filters.availability, props.filters.bestPriceOnly, props.filters.featured, props.filters.trending].filter(Boolean).length;

  function close() { dialogRef.current?.close(); }
  function backdrop(event: MouseEvent<HTMLDialogElement>) { if (event.target === event.currentTarget) close(); }

  return (
    <div className="mb-5 lg:mb-0 lg:w-[280px] lg:shrink-0">
      <aside aria-label="Product filters" className="hidden w-[280px] shrink-0 lg:block">
        <form action={action} className="sticky top-40 rounded-2xl border border-[#E5E7EB] bg-white p-5" method="get">
          <h2 className="text-lg font-bold text-[#111827]">Filters</h2><div className="mt-5"><FilterFields {...props} /></div><Actions resetHref={resetHref} />
        </form>
      </aside>
      <button ref={triggerRef} className={`flex min-h-11 items-center justify-center rounded-[10px] border border-[#2563EB] bg-white px-4 text-sm font-bold text-[#1D4ED8] lg:hidden ${focusRing}`} onClick={() => dialogRef.current?.showModal()} type="button">
        Filters{activeCount ? ` (${activeCount})` : ""}
      </button>
      <dialog ref={dialogRef} aria-labelledby="filter-sheet-title" className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none bg-transparent p-0 backdrop:bg-[#111827]/50 lg:hidden" onClick={backdrop} onClose={() => triggerRef.current?.focus()}>
        <form action={action} className="absolute inset-x-0 bottom-0 max-h-[90dvh] overflow-y-auto rounded-t-2xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl" method="get">
          <div className="mb-5 flex items-center justify-between border-b border-[#E5E7EB] pb-4"><h2 className="text-lg font-bold text-[#111827]" id="filter-sheet-title">Filter products</h2><button aria-label="Close filters" className={`flex h-11 w-11 items-center justify-center rounded-[10px] text-2xl text-[#6B7280] hover:bg-[#F8FAFC] ${focusRing}`} onClick={close} type="button">×</button></div>
          <FilterFields {...props} /><Actions onApply={close} resetHref={resetHref} />
        </form>
      </dialog>
    </div>
  );
}
