import type { AdminCategoryListItem } from "@/lib/data/admin-categories";
import { CategoryActions } from "./category-actions";
import { CategoryStatusBadge } from "./category-status-badge";

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not available" : dateFormatter.format(date);
}

export function CategoryTable({ categories }: { categories: AdminCategoryListItem[] }) {
  return (
    <>
      <div className="space-y-4 md:hidden">
        {categories.map((category) => (
          <article key={category.id} className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate font-semibold text-[#111827]">{category.name}</h2>
                <p className="mt-1 truncate text-sm text-[#6B7280]">/{category.slug}</p>
              </div>
              <CategoryStatusBadge isActive={category.is_active} />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-[#E5E7EB] pt-4 text-sm">
              <div>
                <dt className="text-[#6B7280]">Products</dt>
                <dd className="mt-1 font-semibold text-[#111827]">{category.productCount}</dd>
              </div>
              <div>
                <dt className="text-[#6B7280]">Display order</dt>
                <dd className="mt-1 font-semibold text-[#111827]">{category.display_order}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-[#6B7280]">Updated</dt>
                <dd className="mt-1 font-medium text-[#111827]"><time dateTime={category.updated_at}>{formatDate(category.updated_at)}</time></dd>
              </div>
            </dl>
            <div className="mt-4 border-t border-[#E5E7EB] pt-4">
              <CategoryActions categoryId={category.id} categoryName={category.name} isActive={category.is_active} />
            </div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[68rem] border-collapse text-left">
          <caption className="sr-only">Categories sorted by display order</caption>
          <thead className="bg-[#F8FAFC] text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
            <tr>
              <th className="px-5 py-3" scope="col">Name</th>
              <th className="px-5 py-3" scope="col">Slug</th>
              <th className="px-5 py-3" scope="col">Product count</th>
              <th className="px-5 py-3" scope="col">Status</th>
              <th className="px-5 py-3" scope="col">Display order</th>
              <th className="px-5 py-3" scope="col">Updated</th>
              <th className="px-5 py-3" scope="col">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {categories.map((category) => (
              <tr key={category.id} className="align-middle">
                <th className="px-5 py-4 text-sm font-semibold text-[#111827]" scope="row">{category.name}</th>
                <td className="px-5 py-4 text-sm text-[#6B7280]">/{category.slug}</td>
                <td className="px-5 py-4 text-sm font-semibold text-[#111827]">{category.productCount}</td>
                <td className="px-5 py-4"><CategoryStatusBadge isActive={category.is_active} /></td>
                <td className="px-5 py-4 text-sm font-semibold text-[#111827]">{category.display_order}</td>
                <td className="px-5 py-4 text-sm text-[#6B7280]"><time dateTime={category.updated_at}>{formatDate(category.updated_at)}</time></td>
                <td className="px-5 py-4"><CategoryActions categoryId={category.id} categoryName={category.name} isActive={category.is_active} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
