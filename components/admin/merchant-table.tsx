import type { AdminMerchantListItem } from "@/lib/data/admin-merchants";
import { MerchantActions } from "./merchant-actions";
import { MerchantLogoPreview } from "./merchant-logo-preview";
import { StatusBadge } from "./offer-status-badge";

const dateFormatter = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not available" : dateFormatter.format(date);
}

function Website({ merchant }: { merchant: AdminMerchantListItem }) {
  return merchant.website_url ? (
    <a aria-label={`Open ${merchant.name} website`} className="block max-w-64 truncate font-medium text-[#1D4ED8] underline decoration-[#93C5FD] underline-offset-2 hover:text-[#1E40AF] focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2" href={merchant.website_url} rel="noopener noreferrer" target="_blank" title={merchant.website_url}>{merchant.website_url}</a>
  ) : <span className="text-[#9CA3AF]">Not set</span>;
}

export function MerchantTable({ merchants }: { merchants: AdminMerchantListItem[] }) {
  return (
    <>
      <div className="space-y-4 lg:hidden">
        {merchants.map((merchant) => (
          <article key={merchant.id} className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
            <div className="flex items-start gap-3"><MerchantLogoPreview logoUrl={merchant.logo_url} name={merchant.name} /><div className="min-w-0 flex-1"><h2 className="truncate font-semibold text-[#111827]">{merchant.name}</h2><div className="mt-2"><StatusBadge isActive={merchant.is_active} /></div></div></div>
            <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-[#E5E7EB] pt-4 text-sm"><div className="col-span-2 min-w-0"><dt className="text-[#6B7280]">Website</dt><dd className="mt-1"><Website merchant={merchant} /></dd></div><div><dt className="text-[#6B7280]">Affiliate network</dt><dd className="mt-1 font-semibold text-[#111827]">{merchant.affiliate_network}</dd></div><div><dt className="text-[#6B7280]">Offers</dt><dd className="mt-1 font-semibold text-[#111827]">{merchant.offerCount}</dd></div><div className="col-span-2"><dt className="text-[#6B7280]">Updated</dt><dd className="mt-1 font-medium text-[#111827]"><time dateTime={merchant.updated_at}>{formatDate(merchant.updated_at)}</time></dd></div></dl>
            <div className="mt-4 border-t border-[#E5E7EB] pt-4"><MerchantActions isActive={merchant.is_active} merchantId={merchant.id} merchantName={merchant.name} /></div>
          </article>
        ))}
      </div>
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[88rem] border-collapse text-left">
          <caption className="sr-only">Merchants sorted alphabetically by name</caption>
          <thead className="bg-[#F8FAFC] text-xs font-semibold uppercase tracking-wide text-[#6B7280]"><tr><th className="px-5 py-3" scope="col">Merchant logo and name</th><th className="px-5 py-3" scope="col">Website</th><th className="px-5 py-3" scope="col">Affiliate network</th><th className="px-5 py-3" scope="col">Offers</th><th className="px-5 py-3" scope="col">Status</th><th className="px-5 py-3" scope="col">Updated</th><th className="px-5 py-3" scope="col">Actions</th></tr></thead>
          <tbody className="divide-y divide-[#E5E7EB]">{merchants.map((merchant) => <tr key={merchant.id} className="align-middle"><th className="px-5 py-4" scope="row"><div className="flex items-center gap-3"><MerchantLogoPreview logoUrl={merchant.logo_url} name={merchant.name} /><span className="max-w-xs truncate text-sm font-semibold text-[#111827]">{merchant.name}</span></div></th><td className="max-w-64 px-5 py-4 text-sm"><Website merchant={merchant} /></td><td className="px-5 py-4 text-sm font-semibold text-[#111827]">{merchant.affiliate_network}</td><td className="px-5 py-4 text-sm font-semibold text-[#111827]">{merchant.offerCount}</td><td className="px-5 py-4"><StatusBadge isActive={merchant.is_active} /></td><td className="px-5 py-4 text-sm text-[#6B7280]"><time dateTime={merchant.updated_at}>{formatDate(merchant.updated_at)}</time></td><td className="px-5 py-4"><MerchantActions isActive={merchant.is_active} merchantId={merchant.id} merchantName={merchant.name} /></td></tr>)}</tbody>
        </table>
      </div>
    </>
  );
}
