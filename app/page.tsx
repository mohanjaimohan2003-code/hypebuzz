import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { ProductCard } from "@/components/product/product-card";
import { sampleProducts } from "@/lib/data/sample-products";

function ArrowIcon() {
  return <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24"><path d="M5 12h14m-5-5 5 5-5 5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>;
}

function ProductSection({ title, eyebrow, products, href }: { title: string; eyebrow: string; products: typeof sampleProducts; href: string }) {
  return (
    <section aria-labelledby={`${eyebrow}-heading`} className="py-8 sm:py-10">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#2563EB]">{eyebrow}</p><h2 className="mt-1 text-2xl font-bold tracking-tight text-[#111827] sm:text-3xl" id={`${eyebrow}-heading`}>{title}</h2></div>
        <Link className="flex min-h-11 shrink-0 items-center gap-2 rounded-[10px] px-3 text-sm font-semibold text-[#1D4ED8] hover:bg-[#EFF6FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]" href={href}>View all <ArrowIcon /></Link>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,13.5rem),1fr))] gap-4">{products.map((product) => <ProductCard key={`${eyebrow}-${product.id}`} product={product} />)}</div>
    </section>
  );
}

export default function Home() {
  return (
    <><Navbar /><main className="min-h-screen bg-[#F8FAFC]" id="main-content">
      <section aria-label="HypeBuzz featured deals" className="bg-[#020817]">
        <Link aria-label="Explore HypeBuzz deals" className="mx-auto block max-w-[1718px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#60A5FA]" href="/deals">
          <Image alt="HypeBuzz handpicked deals and everyday savings promotion" className="h-auto w-full" height={916} priority sizes="100vw" src="/brand/hypebuzz-banner.png" width={1718} />
        </Link>
      </section>
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <ProductSection eyebrow="Trending deals" href="/trending" products={sampleProducts} title="Deals shoppers are watching" />
        <div className="border-t border-[#E5E7EB]" />
        <ProductSection eyebrow="Featured products" href="/collections/featured" products={[...sampleProducts].reverse()} title="Handpicked for smarter shopping" />
      </div>
    </main></>
  );
}
