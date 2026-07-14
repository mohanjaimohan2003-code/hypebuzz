import { AdminEmptyState } from "@/components/admin/admin-empty-state";

export default function ProductNotFound() {
  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-white">
      <AdminEmptyState
        actionHref="/admin/products"
        actionLabel="Return to Products"
        description="This product may have been removed or the address may be incorrect. No changes were made."
        title="Product not found"
      />
    </div>
  );
}
