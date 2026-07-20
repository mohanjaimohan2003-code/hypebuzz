import Link from "next/link";
import type { HomepageCategory } from "@/lib/data/homepage";
import { HomeEmptyState } from "./home-empty-state";

export function FeaturedCategories({ categories }: { categories: HomepageCategory[] }) {
  return (
    <section aria-labelledby="featured-categories-heading" className="border-t border-[#E5E7EB] py-10 sm:py-12">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#2563EB]">Browse by interest</p>
      <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#111827] sm:text-3xl" id="featured-categories-heading">Featured Categories</h2>
      {categories.length ? <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">{categories.map((category) => <li key={category.id}><Link className="flex min-h-24 flex-col items-center justify-center rounded-xl border border-[#E5E7EB] bg-white px-3 text-center transition-[border-color,box-shadow] hover:border-[#93C5FD] hover:shadow-[0_8px_20px_rgba(37,99,235,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2" href={`/categories/${category.slug}`}><span className="font-bold text-[#111827]">{category.name}</span><span className="mt-1 text-xs text-[#6B7280]">{category.productCount} {category.productCount === 1 ? "product" : "products"}</span></Link></li>)}</ul> : <div className="mt-6"><HomeEmptyState message="Featured categories will appear when active categories are available." /></div>}
    </section>
  );
}
