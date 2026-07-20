import { AdminEmptyState } from "@/components/admin/admin-empty-state";

export default function MerchantNotFound() {
  return <div className="rounded-2xl border border-[#E5E7EB] bg-white"><AdminEmptyState actionHref="/admin/merchants" actionLabel="Return to Merchants" description="This merchant may no longer exist or the address may be incorrect. No changes were made." title="Merchant not found" /></div>;
}
