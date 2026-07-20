import Link from "next/link";

type Props = {
  categoryHref: string;
  hasFilters: boolean;
};

export function CategoryEmptyState({ categoryHref, hasFilters }: Props) {
  return (
    <div className="rounded-2xl border border-dashed border-[#CBD5E1] bg-white px-6 py-14 text-center">
      <h2 className="text-xl font-bold text-[#111827]">
        {hasFilters ? "No products match these filters" : "No products are available in this category yet."}
      </h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#6B7280]">
        {hasFilters ? "Try clearing one or more filters to see other products in this category." : "New products and merchant offers will appear here when they are published."}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link className="inline-flex min-h-11 items-center justify-center rounded-[10px] border border-[#D1D5DB] bg-white px-4 text-sm font-semibold text-[#111827] hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]" href="/">Back to home</Link>
        {hasFilters ? <Link className="inline-flex min-h-11 items-center justify-center rounded-[10px] border border-[#2563EB] px-4 text-sm font-bold text-[#1D4ED8] hover:bg-[#EFF6FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]" href={categoryHref}>Clear filters</Link> : null}
        <Link className="inline-flex min-h-11 items-center justify-center rounded-[10px] border border-[#2563EB] px-4 text-sm font-bold text-[#1D4ED8] hover:bg-[#EFF6FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]" href="/search">Browse all products</Link>
        <Link className="inline-flex min-h-11 items-center justify-center rounded-[10px] bg-[#2563EB] px-4 text-sm font-bold text-white hover:bg-[#1D4ED8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]" href="/search">Search products</Link>
      </div>
    </div>
  );
}
