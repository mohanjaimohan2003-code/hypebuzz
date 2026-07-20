import Link from "next/link";
import type { HomepageBrand } from "@/lib/data/homepage";
import { HomeEmptyState } from "./home-empty-state";

export function PopularBrands({ brands }: { brands: HomepageBrand[] }) {
  return (
    <section aria-labelledby="popular-brands-heading" className="border-t border-[#E5E7EB] py-10 sm:py-12">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#2563EB]">Explore trusted names</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#111827] sm:text-3xl" id="popular-brands-heading">Popular Brands</h2>
        </div>
      </div>
      {brands.length ? <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
        {brands.map((brand) => (
          <li key={brand.id}>
            <Link
              className="flex min-h-20 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white px-3 text-center text-base font-bold tracking-tight text-[#111827] transition-[border-color,color,box-shadow] duration-150 hover:border-[#93C5FD] hover:text-[#1D4ED8] hover:shadow-[0_8px_20px_rgba(37,99,235,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 motion-reduce:transition-none"
              href={`/search?brand=${brand.slug}`}
            >
              <span><span className="block">{brand.name}</span><span className="mt-1 block text-xs font-medium text-[#6B7280]">{brand.productCount} {brand.productCount === 1 ? "product" : "products"}</span></span>
            </Link>
          </li>
        ))}
      </ul> : <HomeEmptyState message="Popular brands will appear when active brands have published products." />}
    </section>
  );
}
