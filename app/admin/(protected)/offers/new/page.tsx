import type { Metadata } from "next";
import Link from "next/link";
import { OfferForm } from "@/components/admin/offer-form";
import { getAdminOfferOptions } from "@/lib/data/admin-offers";

export const metadata: Metadata = { title: "Add Offer | HypeBuzz Admin" };

export default async function NewOfferPage() {
  const { products, merchants, hasError } = await getAdminOfferOptions();
  return (
    <div className="mx-auto max-w-5xl">
      <Link className="inline-flex min-h-11 items-center rounded-[10px] px-2 text-sm font-semibold text-[#1D4ED8] hover:bg-[#EFF6FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2" href="/admin/offers">&larr; Back to offers</Link>
      <header className="mt-4"><p className="text-sm font-semibold text-[#2563EB]">Affiliate management</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-[#111827] sm:text-4xl">Add Offer</h1><p className="mt-3 max-w-2xl text-base leading-7 text-[#6B7280]">Connect a product to a merchant with transparent price and stock context.</p></header>
      {hasError || products.length === 0 || merchants.length === 0 ? <div className="mt-6 rounded-[10px] border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-3 text-sm font-medium text-[#991B1B]" role="alert">Products or merchants could not be loaded. Ensure catalog read policies and seed data are available before creating an offer.</div> : null}
      <OfferForm merchants={merchants} mode="create" products={products} />
    </div>
  );
}
