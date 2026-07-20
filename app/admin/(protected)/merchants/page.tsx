import type { Metadata } from "next";
import Link from "next/link";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminIcon } from "@/components/admin/admin-icon";
import { MerchantTable } from "@/components/admin/merchant-table";
import { getAdminMerchants, parseMerchantStatusFilter } from "@/lib/data/admin-merchants";

export const metadata: Metadata = { title: "Merchants | HypeBuzz Admin" };

type MerchantsSearchParams = Promise<{ q?: string | string[]; status?: string | string[]; notice?: string | string[] }>;
const notices: Record<string, string> = { created: "Merchant created successfully.", updated: "Merchant updated successfully.", disabled: "Merchant disabled successfully.", enabled: "Merchant enabled successfully." };

function getFirst(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminMerchantsPage({ searchParams }: { searchParams: MerchantsSearchParams }) {
  const params = await searchParams;
  const search = (getFirst(params.q) ?? "").trim().slice(0, 100);
  const status = parseMerchantStatusFilter(getFirst(params.status));
  const notice = notices[getFirst(params.notice) ?? ""];
  const { merchants, hasError } = await getAdminMerchants({ search, status });
  const hasFilters = Boolean(search || status !== "all");

  return (
    <div>
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold text-[#2563EB]">Affiliate management</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-[#111827] sm:text-4xl">Merchants</h1><p className="mt-3 max-w-2xl text-base leading-7 text-[#6B7280]">Manage approved shopping destinations, affiliate networks, and offer eligibility.</p></div><Link className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-[10px] bg-[#2563EB] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#1D4ED8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 motion-reduce:transition-none" href="/admin/merchants/new"><AdminIcon className="h-5 w-5" name="plus" /> Add Merchant</Link></header>
      {notice ? <div className="mt-6 rounded-[10px] border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-3 text-sm font-medium text-[#166534]" role="status">{notice}</div> : null}
      {hasError ? <div className="mt-6 rounded-[10px] border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-3 text-sm font-medium text-[#991B1B]" role="alert">Merchants could not be loaded. Check the Supabase connection and merchant policies, then try again.</div> : null}

      <form action="/admin/merchants" className="mt-8 grid gap-4 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-[0_1px_2px_rgba(17,24,39,0.04)] sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_14rem_auto_auto] lg:items-end" method="get" role="search"><div><label className="text-sm font-semibold text-[#111827]" htmlFor="merchant-search">Search by merchant name</label><div className="relative mt-2"><AdminIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#6B7280]" name="search" /><input className="h-11 w-full rounded-[10px] border border-[#D1D5DB] bg-white pl-10 pr-4 text-sm text-[#111827] outline-none placeholder:text-[#6B7280] hover:border-[#9CA3AF] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2" defaultValue={search} id="merchant-search" maxLength={100} name="q" placeholder="Search merchants" type="search" /></div></div><div><label className="text-sm font-semibold text-[#111827]" htmlFor="merchant-status-filter">Status</label><select className="mt-2 h-11 w-full rounded-[10px] border border-[#D1D5DB] bg-white px-3 text-sm text-[#111827] outline-none hover:border-[#9CA3AF] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2" defaultValue={status} id="merchant-status-filter" name="status"><option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select></div><button className="inline-flex min-h-11 items-center justify-center rounded-[10px] bg-[#2563EB] px-5 text-sm font-semibold text-white hover:bg-[#1D4ED8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2" type="submit">Apply</button><Link className="inline-flex min-h-11 items-center justify-center rounded-[10px] border border-[#D1D5DB] bg-white px-4 text-sm font-semibold text-[#111827] hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2" href="/admin/merchants">Reset</Link></form>

      <section aria-labelledby="merchants-list-heading" className="mt-6"><div className="mb-3 flex items-center justify-between gap-4"><h2 className="text-xl font-bold text-[#111827]" id="merchants-list-heading">Merchant records</h2><p className="text-sm text-[#6B7280]">{merchants.length} {merchants.length === 1 ? "merchant" : "merchants"}</p></div>{merchants.length === 0 ? <div className="rounded-2xl border border-[#E5E7EB] bg-white"><AdminEmptyState actionHref={hasFilters ? "/admin/merchants" : "/admin/merchants/new"} actionLabel={hasFilters ? "Clear filters" : "Add Merchant"} description={hasFilters ? "No merchants match the current search and status filters." : "Create the first merchant to begin managing affiliate destinations."} title={hasFilters ? "No matching merchants" : "No merchants added yet"} /></div> : <div className="lg:overflow-hidden lg:rounded-2xl lg:border lg:border-[#E5E7EB] lg:bg-white lg:shadow-[0_1px_2px_rgba(17,24,39,0.04)]"><MerchantTable merchants={merchants} /></div>}</section>
    </div>
  );
}
