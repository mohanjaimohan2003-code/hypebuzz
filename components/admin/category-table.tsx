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

function Description({ value }: { value: string | null }) {
  return value ? (
    <span className="line-clamp-2">{value}</span>
  ) : (
    <span className="text-[#9CA3AF]">No description</span>
  );
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
            <p className="mt-4 text-sm leading-6 text-[#4B5563]">
              <Description value={category.description} />
            </p>
            <dl className="mt-4 border-t border-[#E5E7EB] pt-4 text-sm">
              <dt className="text-[#6B7280]">Created</dt>
              <dd className="mt-1 font-medium text-[#111827]"><time dateTime={category.created_at}>{formatDate(category.created_at)}</time></dd>
            </dl>
            <div className="mt-4 border-t border-[#E5E7EB] pt-4">
              <CategoryActions categoryId={category.id} categoryName={category.name} isActive={category.is_active} />
            </div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[62rem] border-collapse text-left">
          <caption className="sr-only">Categories sorted from newest to oldest</caption>
          <thead className="bg-[#F8FAFC] text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
            <tr>
              <th className="px-5 py-3" scope="col">Name</th>
              <th className="px-5 py-3" scope="col">Slug</th>
              <th className="px-5 py-3" scope="col">Description</th>
              <th className="px-5 py-3" scope="col">Status</th>
              <th className="px-5 py-3" scope="col">Created</th>
              <th className="px-5 py-3" scope="col">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {categories.map((category) => (
              <tr key={category.id} className="align-middle">
                <th className="px-5 py-4 text-sm font-semibold text-[#111827]" scope="row">{category.name}</th>
                <td className="px-5 py-4 text-sm text-[#6B7280]">/{category.slug}</td>
                <td className="max-w-xs px-5 py-4 text-sm leading-6 text-[#4B5563]"><Description value={category.description} /></td>
                <td className="px-5 py-4"><CategoryStatusBadge isActive={category.is_active} /></td>
                <td className="px-5 py-4 text-sm text-[#6B7280]"><time dateTime={category.created_at}>{formatDate(category.created_at)}</time></td>
                <td className="px-5 py-4"><CategoryActions categoryId={category.id} categoryName={category.name} isActive={category.is_active} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
