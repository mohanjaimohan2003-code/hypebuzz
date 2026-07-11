import { Navbar } from "@/components/layout/navbar";
import { ProductCard, type ProductCardProduct } from "@/components/product/product-card";

const products = [
  { id: "aurora", name: "Aurora Pro Wireless Headphones", brand: "Northstar Audio", imageSrc: "/products/aurora-headphones.svg", imageAlt: "Blue Aurora Pro over-ear wireless headphones", price: 7499, storeCount: 6, productHref: "/products/aurora-pro-wireless-headphones", dealsHref: "/products/aurora-pro-wireless-headphones#deals" },
  { id: "pulse", name: "Pulse Active Smart Watch", brand: "Vela", imageSrc: "/products/pulse-watch.svg", imageAlt: "Black Pulse Active smart watch with a blue display", price: 4299, storeCount: 4, productHref: "/products/pulse-active-smart-watch", dealsHref: "/products/pulse-active-smart-watch#deals", initiallyWishlisted: true },
  { id: "echo", name: "Echo Mini Portable Speaker", brand: "Sonora", imageSrc: "/products/echo-speaker.svg", imageAlt: "Compact blue Echo Mini wireless speaker", price: 2799, storeCount: 3, productHref: "/products/echo-mini-portable-speaker", dealsHref: "/products/echo-mini-portable-speaker#deals" },
] satisfies ProductCardProduct[];

export default function Home() {
  return <><Navbar /><main className="min-h-screen bg-[#F8FAFC] px-4 py-8 sm:px-6 lg:px-8" id="main-content">
    <section className="mx-auto flex max-w-7xl flex-col gap-10 rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm sm:p-10 lg:flex-row lg:items-center lg:justify-between lg:p-16">
      <div className="max-w-2xl"><p className="mb-4 inline-flex rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">New • HypeBuzz discovery experience</p><h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">Discover the next favorite product in minutes.</h1><p className="mt-5 text-lg text-slate-600 sm:text-xl">Explore trending picks, compare options, and save favorites in a polished shopping experience built for modern buyers.</p><div className="mt-8 flex flex-col gap-3 sm:flex-row"><a className="rounded-full bg-slate-900 px-6 py-3 text-center font-semibold text-white transition hover:bg-slate-700" href="/categories">Explore products</a><a className="rounded-full border border-slate-300 px-6 py-3 text-center font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50" href="/wishlist">View wishlist</a></div></div>
      <div className="w-full max-w-xl rounded-[24px] bg-[#111827] p-6 text-white shadow-xl"><p className="text-sm font-medium text-blue-200">Shop with clarity</p><h2 className="mt-2 text-2xl font-semibold">One card. Every discovery surface.</h2><p className="mt-3 leading-6 text-slate-300">See the best current price, compare options, and jump straight to available deals.</p></div>
    </section>
    <section aria-labelledby="trending-heading" className="mx-auto max-w-7xl py-12 sm:py-16 lg:py-20"><div className="mb-6 sm:mb-8"><p className="text-sm font-semibold text-[#2563EB]">Fresh finds</p><h2 className="mt-2 text-3xl font-bold tracking-tight text-[#111827]" id="trending-heading">Trending now</h2><p className="mt-2 max-w-2xl text-[#6B7280]">Temporary sample products showing the strongest prices across available stores.</p></div><div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,17rem),1fr))] gap-4 sm:gap-6">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div></section>
  </main></>;
}
