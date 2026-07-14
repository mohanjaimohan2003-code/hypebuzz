import { AdminEmptyState } from "@/components/admin/admin-empty-state";

export default function BrandNotFound() {
  return <div className="rounded-2xl border border-[#E5E7EB] bg-white"><AdminEmptyState actionHref="/admin/brands" actionLabel="Return to Brands" description="This brand may no longer exist or the address may be incorrect. No changes were made." title="Brand not found" /></div>;
}
