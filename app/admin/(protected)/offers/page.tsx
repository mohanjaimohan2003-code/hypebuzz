import type { Metadata } from "next";
import Link from "next/link";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminIcon } from "@/components/admin/admin-icon";
import { OffersTable } from "@/components/admin/offer-table";
import {
  getAdminOffers,
  parseMerchantFilter,
  parseOfferActiveFilter,
} from "@/lib/data/admin-offers";

export const metadata: Metadata = { title: "Offers | HypeBuzz Admin" };

type OffersSearchParams = Promise<{
  q?: string | string[];
  merchant?: string | string[];
  status?: string | string[];
  notice?: string | string[];
}>;
const notices: Record<string, string> = { created: "Offer created successfully.", updated: "Offer updated successfully.", disabled: "Offer disabled successfully." };

function getFirst(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminOffersPage({ searchParams }: { searchParams: OffersSearchParams }) {
  const params = await searchParams;
  const search = (getFirst(params.q) ?? "").trim().slice(0, 100);
  const merchantId = parseMerchantFilter(getFirst(params.merchant));
  const activeStatus = parseOfferActiveFilter(getFirst(params.status));
  const notice = notices[getFirst(params.notice) ?? ""];
  const { offers, merchants, hasError } = await getAdminOffers({
    search,
    merchantId,
    activeStatus,
  });
  const hasFilters = Boolean(
    search || merchantId !== "all" || activeStatus !== "all",
  );

  return (
    <div>
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-sm font-semibold text-[#2563EB]">Affiliate management</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-[#111827] sm:text-4xl">Offers</h1><p className="mt-3 max-w-2xl text-base leading-7 text-[#6B7280]">Manage merchant destinations, prices, stock context, and offer visibility.</p></div>
        <Link className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-[10px] bg-[#2563EB] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#1D4ED8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 motion-reduce:transition-none" href="/admin/offers/new"><AdminIcon className="h-5 w-5" name="plus" /> Add Offer</Link>
      </header>
      {notice ? <div className="mt-6 rounded-[10px] border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-3 text-sm font-medium text-[#166534]" role="status">{notice}</div> : null}
      {hasError ? <div className="mt-6 rounded-[10px] border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-3 text-sm font-medium text-[#991B1B]" role="alert">Offers could not be loaded. Check the Supabase connection and offer policies, then try again.</div> : null}

      <form action="/admin/offers" className="mt-8 grid gap-4 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-[0_1px_2px_rgba(17,24,39,0.04)] md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_14rem_12rem_auto_auto] xl:items-end" method="get" role="search">
        <div><label className="text-sm font-semibold text-[#111827]" htmlFor="offer-search">Search by product</label><div className="relative mt-2"><AdminIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#6B7280]" name="search" /><input className="h-11 w-full rounded-[10px] border border-[#D1D5DB] bg-white pl-10 pr-4 text-sm text-[#111827] outline-none placeholder:text-[#6B7280] hover:border-[#9CA3AF] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2" defaultValue={search} id="offer-search" maxLength={100} name="q" placeholder="Search products" type="search" /></div></div>
        <div><label className="text-sm font-semibold text-[#111827]" htmlFor="offer-merchant-filter">Merchant</label><select className="mt-2 h-11 w-full rounded-[10px] border border-[#D1D5DB] bg-white px-3 text-sm text-[#111827] outline-none hover:border-[#9CA3AF] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2" defaultValue={merchantId} id="offer-merchant-filter" name="merchant"><option value="all">All merchants</option>{merchants.map((merchant) => <option key={merchant.id} value={merchant.id}>{merchant.name}</option>)}</select></div>
        <div><label className="text-sm font-semibold text-[#111827]" htmlFor="offer-status-filter">Status</label><select className="mt-2 h-11 w-full rounded-[10px] border border-[#D1D5DB] bg-white px-3 text-sm text-[#111827] outline-none hover:border-[#9CA3AF] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2" defaultValue={activeStatus} id="offer-status-filter" name="status"><option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
        <button className="inline-flex min-h-11 items-center justify-center rounded-[10px] bg-[#2563EB] px-5 text-sm font-semibold text-white hover:bg-[#1D4ED8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2" type="submit">Apply</button>
        <Link className="inline-flex min-h-11 items-center justify-center rounded-[10px] border border-[#D1D5DB] bg-white px-4 text-sm font-semibold text-[#111827] hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2" href="/admin/offers">Reset</Link>
      </form>

      <section aria-labelledby="offers-list-heading" className="mt-6">
        <div className="mb-3 flex items-center justify-between gap-4"><h2 className="text-xl font-bold text-[#111827]" id="offers-list-heading">Offer records</h2><p className="text-sm text-[#6B7280]">{offers.length} {offers.length === 1 ? "offer" : "offers"}</p></div>
        {offers.length === 0 ? <div className="rounded-2xl border border-[#E5E7EB] bg-white"><AdminEmptyState actionHref={hasFilters ? "/admin/offers" : "/admin/offers/new"} actionLabel={hasFilters ? "Clear filters" : "Add Offer"} description={hasFilters ? "No offers match the current product search, merchant, and status filters." : "Create the first merchant offer for a product."} title={hasFilters ? "No matching offers" : "No offers added yet"} /></div> : <div className="lg:overflow-hidden lg:rounded-2xl lg:border lg:border-[#E5E7EB] lg:bg-white lg:shadow-[0_1px_2px_rgba(17,24,39,0.04)]"><OffersTable offers={offers} /></div>}
      </section>
    </div>
  );
}
