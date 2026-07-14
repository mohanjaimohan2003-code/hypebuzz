import { AdminEmptyState } from "@/components/admin/admin-empty-state";

export default function OfferNotFound() {
  return <div className="rounded-2xl border border-[#E5E7EB] bg-white"><AdminEmptyState actionHref="/admin/offers" actionLabel="Return to Offers" description="This offer may no longer exist or the address may be incorrect. No changes were made." title="Offer not found" /></div>;
}
