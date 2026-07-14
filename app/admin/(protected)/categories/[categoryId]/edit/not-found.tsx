import { AdminEmptyState } from "@/components/admin/admin-empty-state";

export default function CategoryNotFound() {
  return <div className="rounded-2xl border border-[#E5E7EB] bg-white"><AdminEmptyState actionHref="/admin/categories" actionLabel="Return to Categories" description="This category may no longer exist or the address may be incorrect. No changes were made." title="Category not found" /></div>;
}
