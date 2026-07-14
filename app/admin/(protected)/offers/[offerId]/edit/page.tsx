import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { OfferForm } from "@/components/admin/offer-form";
import { getAdminOfferEditorData } from "@/lib/data/admin-offers";
import { isOfferStockStatus } from "@/lib/validation/offer";

export const metadata: Metadata = { title: "Edit Offer | HypeBuzz Admin" };

export default async function EditOfferPage({ params }: { params: Promise<{ offerId: string }> }) {
  const { offerId } = await params;
  const { offer, products, merchants, hasError } = await getAdminOfferEditorData(offerId);
  if (!offer && !hasError) notFound();
  if (!offer) return <div className="rounded-2xl border border-[#E5E7EB] bg-white"><AdminEmptyState actionHref="/admin/offers" actionLabel="Return to Offers" description="The offer data could not be loaded safely. Try again after checking the Supabase connection." title="Unable to load offer" /></div>;

  return (
    <div className="mx-auto max-w-5xl">
      <Link className="inline-flex min-h-11 items-center rounded-[10px] px-2 text-sm font-semibold text-[#1D4ED8] hover:bg-[#EFF6FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2" href="/admin/offers">&larr; Back to offers</Link>
      <header className="mt-4"><p className="text-sm font-semibold text-[#2563EB]">Affiliate management</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-[#111827] sm:text-4xl">Edit Offer</h1><p className="mt-3 max-w-2xl text-base leading-7 text-[#6B7280]">Update the merchant destination, price, stock context, and visibility.</p></header>
      {hasError || products.length === 0 || merchants.length === 0 ? <div className="mt-6 rounded-[10px] border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-3 text-sm font-medium text-[#991B1B]" role="alert">Products or merchants could not be loaded. Offer changes are disabled until catalog access is restored.</div> : null}
      <OfferForm merchants={merchants} mode="edit" offer={{ id: offer.id, productId: offer.product_id, merchantId: offer.merchant_id, affiliateUrl: offer.affiliate_url, currentPrice: Number(offer.current_price), originalPrice: offer.original_price === null ? null : Number(offer.original_price), currency: offer.currency, stockStatus: offer.availability && isOfferStockStatus(offer.availability) ? offer.availability : "in_stock", isActive: offer.is_active, notes: offer.coupon_note ?? "" }} products={products} />
    </div>
  );
}
