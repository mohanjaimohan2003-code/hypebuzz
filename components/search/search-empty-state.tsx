import Link from "next/link";

export function SearchEmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-[#CBD5E1] bg-white px-6 py-16 text-center">
      <svg aria-hidden="true" className="mx-auto h-10 w-10 text-[#6B7280]" fill="none" viewBox="0 0 24 24">
        <path d="m21 21-4.35-4.35m2.35-5.15a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z" stroke="currentColor" strokeLinecap="round" strokeWidth="1.75" />
      </svg>
      <h2 className="mt-4 text-xl font-bold text-[#111827]">No products found</h2>
      <p className="mt-2 text-sm text-[#6B7280]">Try a broader keyword or clear the current filters.</p>
      <Link className="mt-6 inline-flex min-h-11 items-center justify-center rounded-[10px] bg-[#2563EB] px-5 text-sm font-bold text-white hover:bg-[#1D4ED8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2" href="/search">
        Reset filters
      </Link>
    </div>
  );
}

