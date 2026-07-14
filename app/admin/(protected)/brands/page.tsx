import type { Metadata } from "next";
import Link from "next/link";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminIcon } from "@/components/admin/admin-icon";
import { BrandTable } from "@/components/admin/brand-table";
import { getAdminBrands } from "@/lib/data/admin-brands";

export const metadata: Metadata = { title: "Brands | HypeBuzz Admin" };

type BrandsSearchParams = Promise<{ q?: string | string[]; notice?: string | string[] }>;
const notices: Record<string, string> = { created: "Brand created successfully.", updated: "Brand updated successfully.", disabled: "Brand disabled successfully.", enabled: "Brand enabled successfully." };

function getFirst(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminBrandsPage({ searchParams }: { searchParams: BrandsSearchParams }) {
  const params = await searchParams;
  const search = (getFirst(params.q) ?? "").trim().slice(0, 100);
  const notice = notices[getFirst(params.notice) ?? ""];
  const { brands, hasError } = await getAdminBrands(search);

  return (
    <div>
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-sm font-semibold text-[#2563EB]">Catalog management</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-[#111827] sm:text-4xl">Brands</h1><p className="mt-3 max-w-2xl text-base leading-7 text-[#6B7280]">Create, review, enable, and disable trusted catalog brands.</p></div>
        <Link className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-[10px] bg-[#2563EB] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#1D4ED8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 motion-reduce:transition-none" href="/admin/brands/new"><AdminIcon className="h-5 w-5" name="plus" /> Add Brand</Link>
      </header>
      {notice ? <div className="mt-6 rounded-[10px] border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-3 text-sm font-medium text-[#166534]" role="status">{notice}</div> : null}
      {hasError ? <div className="mt-6 rounded-[10px] border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-3 text-sm font-medium text-[#991B1B]" role="alert">Brands could not be loaded. Check the Supabase connection and admin brand policies, then try again.</div> : null}

      <form action="/admin/brands" className="mt-8 grid gap-4 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-[0_1px_2px_rgba(17,24,39,0.04)] sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end" method="get" role="search">
        <div><label className="text-sm font-semibold text-[#111827]" htmlFor="brand-search">Search by brand name</label><div className="relative mt-2"><AdminIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#6B7280]" name="search" /><input className="h-11 w-full rounded-[10px] border border-[#D1D5DB] bg-white pl-10 pr-4 text-sm text-[#111827] outline-none placeholder:text-[#6B7280] hover:border-[#9CA3AF] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2" defaultValue={search} id="brand-search" maxLength={100} name="q" placeholder="Search brands" type="search" /></div></div>
        <button className="inline-flex min-h-11 items-center justify-center rounded-[10px] bg-[#2563EB] px-5 text-sm font-semibold text-white hover:bg-[#1D4ED8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2" type="submit">Search</button>
        <Link className="inline-flex min-h-11 items-center justify-center rounded-[10px] border border-[#D1D5DB] bg-white px-4 text-sm font-semibold text-[#111827] hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2" href="/admin/brands">Reset</Link>
      </form>

      <section aria-labelledby="brands-list-heading" className="mt-6">
        <div className="mb-3 flex items-center justify-between gap-4"><h2 className="text-xl font-bold text-[#111827]" id="brands-list-heading">Brand records</h2><p className="text-sm text-[#6B7280]">{brands.length} {brands.length === 1 ? "brand" : "brands"}</p></div>
        {brands.length === 0 ? <div className="rounded-2xl border border-[#E5E7EB] bg-white"><AdminEmptyState actionHref={search ? "/admin/brands" : "/admin/brands/new"} actionLabel={search ? "Clear search" : "Add Brand"} description={search ? "No brands match the current search." : "Create the first brand to organize trusted product identities."} title={search ? "No matching brands" : "No brands added yet"} /></div> : <div className="md:overflow-hidden md:rounded-2xl md:border md:border-[#E5E7EB] md:bg-white md:shadow-[0_1px_2px_rgba(17,24,39,0.04)]"><BrandTable brands={brands} /></div>}
      </section>
    </div>
  );
}
