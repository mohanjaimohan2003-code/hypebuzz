import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { MerchantForm } from "@/components/admin/merchant-form";
import { getAdminMerchant } from "@/lib/data/admin-merchants";
import { isAffiliateNetwork } from "@/lib/validation/merchant";

export const metadata: Metadata = { title: "Edit Merchant | HypeBuzz Admin" };

export default async function EditMerchantPage({ params }: { params: Promise<{ merchantId: string }> }) {
  const { merchantId } = await params;
  const { merchant, hasError } = await getAdminMerchant(merchantId);
  if (!merchant && !hasError) notFound();
  if (!merchant) return <div className="rounded-2xl border border-[#E5E7EB] bg-white"><AdminEmptyState actionHref="/admin/merchants" actionLabel="Return to Merchants" description="The merchant data could not be loaded safely. Try again after checking the Supabase connection." title="Unable to load merchant" /></div>;

  return <div className="mx-auto max-w-5xl"><Link className="inline-flex min-h-11 items-center rounded-[10px] px-2 text-sm font-semibold text-[#1D4ED8] hover:bg-[#EFF6FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2" href="/admin/merchants">&larr; Back to merchants</Link><header className="mt-4"><p className="text-sm font-semibold text-[#2563EB]">Affiliate management</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-[#111827] sm:text-4xl">Edit Merchant</h1><p className="mt-3 max-w-2xl text-base leading-7 text-[#6B7280]">Update destination and affiliate settings for <strong className="font-semibold text-[#111827]">{merchant.name}</strong>.</p></header><MerchantForm merchant={{ id: merchant.id, name: merchant.name, slug: merchant.slug, websiteUrl: merchant.website_url ?? "", logoUrl: merchant.logo_url ?? "", affiliateNetwork: isAffiliateNetwork(merchant.affiliate_network) ? merchant.affiliate_network : "Other", affiliateTrackingParameter: merchant.affiliate_tracking_parameter ?? "", isActive: merchant.is_active }} mode="edit" /></div>;
}
