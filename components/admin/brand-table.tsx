import type { AdminBrandListItem } from "@/lib/data/admin-brands";
import { BrandActions } from "./brand-actions";
import { BrandLogoPreview } from "./brand-logo-preview";
import { BrandStatusBadge } from "./brand-status-badge";

const dateFormatter = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not available" : dateFormatter.format(date);
}

export function BrandTable({ brands }: { brands: AdminBrandListItem[] }) {
  return (
    <>
      <div className="space-y-4 md:hidden">
        {brands.map((brand) => (
          <article key={brand.id} className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
            <div className="flex items-start gap-3"><BrandLogoPreview logoUrl={brand.logo_url} name={brand.name} /><div className="min-w-0 flex-1"><h2 className="truncate font-semibold text-[#111827]">{brand.name}</h2><p className="mt-1 truncate text-sm text-[#6B7280]">/{brand.slug}</p><div className="mt-2"><BrandStatusBadge isActive={brand.is_active} /></div></div></div>
            <dl className="mt-4 border-t border-[#E5E7EB] pt-4 text-sm"><dt className="text-[#6B7280]">Created</dt><dd className="mt-1 font-medium text-[#111827]"><time dateTime={brand.created_at}>{formatDate(brand.created_at)}</time></dd></dl>
            <div className="mt-4 border-t border-[#E5E7EB] pt-4"><BrandActions brandId={brand.id} brandName={brand.name} isActive={brand.is_active} /></div>
          </article>
        ))}
      </div>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[58rem] border-collapse text-left">
          <caption className="sr-only">Brands sorted from newest to oldest</caption>
          <thead className="bg-[#F8FAFC] text-xs font-semibold uppercase tracking-wide text-[#6B7280]"><tr><th className="px-5 py-3" scope="col">Brand</th><th className="px-5 py-3" scope="col">Slug</th><th className="px-5 py-3" scope="col">Status</th><th className="px-5 py-3" scope="col">Created</th><th className="px-5 py-3" scope="col">Actions</th></tr></thead>
          <tbody className="divide-y divide-[#E5E7EB]">{brands.map((brand) => <tr key={brand.id} className="align-middle"><th className="px-5 py-4" scope="row"><div className="flex items-center gap-3"><BrandLogoPreview logoUrl={brand.logo_url} name={brand.name} /><span className="max-w-xs truncate text-sm font-semibold text-[#111827]">{brand.name}</span></div></th><td className="px-5 py-4 text-sm text-[#6B7280]">/{brand.slug}</td><td className="px-5 py-4"><BrandStatusBadge isActive={brand.is_active} /></td><td className="px-5 py-4 text-sm text-[#6B7280]"><time dateTime={brand.created_at}>{formatDate(brand.created_at)}</time></td><td className="px-5 py-4"><BrandActions brandId={brand.id} brandName={brand.name} isActive={brand.is_active} /></td></tr>)}</tbody>
        </table>
      </div>
    </>
  );
}
