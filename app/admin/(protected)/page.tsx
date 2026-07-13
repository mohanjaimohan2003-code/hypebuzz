import type { Metadata } from "next";
import Link from "next/link";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminIcon, type AdminIconName } from "@/components/admin/admin-icon";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { getAdminDashboardData } from "@/lib/data/admin-dashboard";
import type { ProductStatus } from "@/lib/types/database";

export const metadata: Metadata = { title: "Dashboard | HypeBuzz Admin" };

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const quickActions: Array<{
  label: string;
  description: string;
  href: string;
  icon: AdminIconName;
}> = [
  {
    label: "Add Product",
    description: "Prepare the product catalog workflow.",
    href: "/admin/products",
    icon: "products",
  },
  {
    label: "Add Category",
    description: "Organize products for easier discovery.",
    href: "/admin/categories",
    icon: "categories",
  },
  {
    label: "Add Brand",
    description: "Create and maintain brand records.",
    href: "/admin/brands",
    icon: "brands",
  },
  {
    label: "Add Merchant",
    description: "Manage approved shopping destinations.",
    href: "/admin/merchants",
    icon: "merchants",
  },
  {
    label: "Import CSV",
    description: "Open the future bulk import workspace.",
    href: "/admin/import",
    icon: "import",
  },
];

function formatCreatedDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not available"
    : dateFormatter.format(date);
}

function getStatusStyle(status: ProductStatus) {
  if (status === "published") {
    return { dot: "bg-[#16A34A]", label: "Published" };
  }

  if (status === "archived") {
    return { dot: "bg-[#6B7280]", label: "Archived" };
  }

  return { dot: "bg-[#2563EB]", label: "Draft" };
}

export default async function AdminPage() {
  const dashboard = await getAdminDashboardData();
  const statCards: Array<{
    label: string;
    value: number;
    icon: AdminIconName;
    description: string;
  }> = [
    {
      label: "Total Products",
      value: dashboard.counts.totalProducts,
      icon: "products",
      description: "All product records across every status.",
    },
    {
      label: "Published Products",
      value: dashboard.counts.publishedProducts,
      icon: "products",
      description: "Products currently visible to shoppers.",
    },
    {
      label: "Draft Products",
      value: dashboard.counts.draftProducts,
      icon: "products",
      description: "Products still being prepared or reviewed.",
    },
    {
      label: "Categories",
      value: dashboard.counts.categories,
      icon: "categories",
      description: "Catalog categories, including inactive records.",
    },
    {
      label: "Brands",
      value: dashboard.counts.brands,
      icon: "brands",
      description: "Brand records available to the catalog.",
    },
    {
      label: "Merchants",
      value: dashboard.counts.merchants,
      icon: "merchants",
      description: "Merchant destinations in the platform.",
    },
    {
      label: "Active Offers",
      value: dashboard.counts.activeOffers,
      icon: "offers",
      description: "Offers currently marked as active.",
    },
  ];

  return (
    <div>
      <header>
        <p className="text-sm font-semibold text-[#2563EB]">Admin overview</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#111827] sm:text-4xl">
          Dashboard
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-[#6B7280]">
          Monitor catalog health and move quickly into the next management task.
        </p>
      </header>

      {dashboard.hasError ? (
        <div
          className="mt-6 rounded-[10px] border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-3 text-sm font-medium text-[#991B1B]"
          role="status"
        >
          Some dashboard data could not be loaded. Unavailable values are shown as 0.
        </div>
      ) : null}

      <section aria-labelledby="dashboard-statistics-heading" className="mt-8">
        <h2 className="sr-only" id="dashboard-statistics-heading">
          Catalog statistics
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => (
            <AdminStatCard key={card.label} {...card} />
          ))}
        </div>
      </section>

      <section aria-labelledby="quick-actions-heading" className="mt-10">
        <div>
          <p className="text-sm font-semibold text-[#2563EB]">Shortcuts</p>
          <h2 className="mt-1 text-2xl font-bold text-[#111827]" id="quick-actions-heading">
            Quick actions
          </h2>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              className="group flex min-h-40 flex-col rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_2px_rgba(17,24,39,0.04)] transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:border-[#2563EB] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 motion-reduce:transform-none motion-reduce:transition-none"
              href={action.href}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-[#EFF6FF] text-[#1D4ED8]">
                <AdminIcon className="h-5 w-5" name={action.icon} />
              </span>
              <span className="mt-4 font-semibold text-[#111827] group-hover:text-[#1D4ED8]">
                {action.label}
              </span>
              <span className="mt-1 text-sm leading-5 text-[#6B7280]">
                {action.description}
              </span>
              <AdminIcon
                className="mt-auto h-5 w-5 self-end text-[#2563EB]"
                name="arrow-right"
              />
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="recent-products-heading" className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#2563EB]">Catalog activity</p>
            <h2 className="mt-1 text-2xl font-bold text-[#111827]" id="recent-products-heading">
              Recent products
            </h2>
          </div>
          <Link
            className="inline-flex min-h-11 items-center gap-2 rounded-[10px] px-3 py-2 text-sm font-semibold text-[#1D4ED8] transition-colors hover:bg-[#EFF6FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 motion-reduce:transition-none"
            href="/admin/products"
          >
            View products
            <AdminIcon className="h-4 w-4" name="arrow-right" />
          </Link>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
          {dashboard.recentProducts.length === 0 ? (
            <AdminEmptyState
              actionHref="/admin/products"
              actionLabel="Open Products"
              description="Products will appear here after the catalog management workflow is available."
              title="No products added yet."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem] border-collapse text-left">
                <caption className="sr-only">
                  Five most recently created products
                </caption>
                <thead className="bg-[#F8FAFC] text-xs font-semibold tracking-wide text-[#6B7280] uppercase">
                  <tr>
                    <th className="px-5 py-3" scope="col">Product name</th>
                    <th className="px-5 py-3" scope="col">Status</th>
                    <th className="px-5 py-3" scope="col">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {dashboard.recentProducts.map((product) => {
                    const status = getStatusStyle(product.status);

                    return (
                      <tr key={product.id}>
                        <th className="px-5 py-4 text-sm font-semibold text-[#111827]" scope="row">
                          {product.name}
                        </th>
                        <td className="px-5 py-4 text-sm text-[#111827]">
                          <span className="inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-white px-2.5 py-1 font-medium">
                            <span aria-hidden="true" className={`h-2 w-2 rounded-full ${status.dot}`} />
                            {status.label}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-[#6B7280]">
                          <time dateTime={product.createdAt}>
                            {formatCreatedDate(product.createdAt)}
                          </time>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
