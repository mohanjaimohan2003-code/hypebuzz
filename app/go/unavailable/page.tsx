import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/layout/footer";
import { HomepageHeader } from "@/components/layout/homepage-header";
import { absoluteUrl } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: "Offer unavailable | HypeBuzz",
  description: "This merchant offer is no longer available.",
  alternates: { canonical: absoluteUrl("/go/unavailable") },
  robots: { index: false, follow: false },
};

export default function OfferUnavailablePage() {
  return (
    <>
      <HomepageHeader />
      <main className="flex min-h-[65vh] items-center bg-[#F8FAFC] px-4 py-16" id="main-content">
        <section className="mx-auto max-w-xl rounded-2xl border border-[#E5E7EB] bg-white p-6 text-center shadow-[0_2px_8px_rgba(17,24,39,0.05)] sm:p-10">
          <p className="text-sm font-semibold text-[#2563EB]">Offer unavailable</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#111827]">This deal can’t be opened</h1>
          <p className="mt-4 leading-7 text-[#6B7280]">The offer may have ended or the merchant destination may no longer be available. No external redirect was performed.</p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link className="inline-flex min-h-11 items-center justify-center rounded-[10px] bg-[#2563EB] px-5 text-sm font-semibold text-white hover:bg-[#1D4ED8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2" href="/search">Browse products</Link>
            <Link className="inline-flex min-h-11 items-center justify-center rounded-[10px] border border-[#D1D5DB] bg-white px-5 text-sm font-semibold text-[#111827] hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2" href="/">Return home</Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
