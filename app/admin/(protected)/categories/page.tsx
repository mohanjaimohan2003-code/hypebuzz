import type { Metadata } from "next";
import Link from "next/link";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminIcon } from "@/components/admin/admin-icon";
import { CategoryTable } from "@/components/admin/category-table";
import {
  getAdminCategories,
  parseCategoryStatusFilter,
} from "@/lib/data/admin-categories";

export const metadata: Metadata = { title: "Categories | HypeBuzz Admin" };

type CategoriesSearchParams = Promise<{
  q?: string | string[];
  status?: string | string[];
  notice?: string | string[];
}>;

const notices: Record<string, string> = {
  created: "Category created successfully.",
  updated: "Category updated successfully.",
  disabled: "Category disabled successfully.",
  enabled: "Category enabled successfully.",
};

function getFirst(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminCategoriesPage({ searchParams }: { searchParams: CategoriesSearchParams }) {
  const params = await searchParams;
  const search = (getFirst(params.q) ?? "").trim().slice(0, 100);
  const status = parseCategoryStatusFilter(getFirst(params.status));
  const notice = notices[getFirst(params.notice) ?? ""];
  const { categories, hasError } = await getAdminCategories({ search, status });
  const hasFilters = Boolean(search || status !== "all");

  return (
    <div>
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#2563EB]">Catalog management</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#111827] sm:text-4xl">Categories</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-[#6B7280]">Create, organize, enable, and disable shopper-facing catalog categories.</p>
        </div>
        <Link className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-[10px] bg-[#2563EB] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#1D4ED8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 motion-reduce:transition-none" href="/admin/categories/new">
          <AdminIcon className="h-5 w-5" name="plus" /> Add Category
        </Link>
      </header>

      {notice ? <div className="mt-6 rounded-[10px] border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-3 text-sm font-medium text-[#166534]" role="status">{notice}</div> : null}
      {hasError ? <div className="mt-6 rounded-[10px] border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-3 text-sm font-medium text-[#991B1B]" role="alert">Categories could not be loaded. Check the Supabase connection and admin category policies, then try again.</div> : null}

      <form action="/admin/categories" className="mt-8 grid gap-4 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-[0_1px_2px_rgba(17,24,39,0.04)] sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_14rem_auto_auto] lg:items-end" method="get" role="search">
        <div>
          <label className="text-sm font-semibold text-[#111827]" htmlFor="category-search">Search by name</label>
          <div className="relative mt-2">
            <AdminIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#6B7280]" name="search" />
            <input className="h-11 w-full rounded-[10px] border border-[#D1D5DB] bg-white pl-10 pr-4 text-sm text-[#111827] outline-none placeholder:text-[#6B7280] hover:border-[#9CA3AF] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2" defaultValue={search} id="category-search" maxLength={100} name="q" placeholder="Search categories" type="search" />
          </div>
        </div>
        <div>
          <label className="text-sm font-semibold text-[#111827]" htmlFor="category-status-filter">Status</label>
          <select className="mt-2 h-11 w-full rounded-[10px] border border-[#D1D5DB] bg-white px-3 text-sm text-[#111827] outline-none hover:border-[#9CA3AF] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2" defaultValue={status} id="category-status-filter" name="status">
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <button className="inline-flex min-h-11 items-center justify-center rounded-[10px] bg-[#2563EB] px-5 text-sm font-semibold text-white hover:bg-[#1D4ED8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2" type="submit">Apply</button>
        <Link className="inline-flex min-h-11 items-center justify-center rounded-[10px] border border-[#D1D5DB] bg-white px-4 text-sm font-semibold text-[#111827] hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2" href="/admin/categories">Reset</Link>
      </form>

      <section aria-labelledby="categories-list-heading" className="mt-6">
        <div className="mb-3 flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-[#111827]" id="categories-list-heading">Category records</h2>
          <p className="text-sm text-[#6B7280]">{categories.length} {categories.length === 1 ? "category" : "categories"}</p>
        </div>
        {categories.length === 0 ? (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white">
            <AdminEmptyState actionHref={hasFilters ? "/admin/categories" : "/admin/categories/new"} actionLabel={hasFilters ? "Clear filters" : "Add Category"} description={hasFilters ? "No categories match the current search and status filters." : "Create the first category to begin organizing the catalog."} title={hasFilters ? "No matching categories" : "No categories added yet"} />
          </div>
        ) : (
          <div className="md:overflow-hidden md:rounded-2xl md:border md:border-[#E5E7EB] md:bg-white md:shadow-[0_1px_2px_rgba(17,24,39,0.04)]"><CategoryTable categories={categories} /></div>
        )}
      </section>
    </div>
  );
}
