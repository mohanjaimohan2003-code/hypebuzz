"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminIcon, type AdminIconName } from "./admin-icon";

type AdminNavigationItem = {
  href: string;
  label: string;
  icon: AdminIconName;
};

export const adminNavigationItems: AdminNavigationItem[] = [
  { href: "/admin", label: "Dashboard", icon: "dashboard" },
  { href: "/admin/products", label: "Products", icon: "products" },
  { href: "/admin/categories", label: "Categories", icon: "categories" },
  { href: "/admin/brands", label: "Brands", icon: "brands" },
  { href: "/admin/merchants", label: "Merchants", icon: "merchants" },
  { href: "/admin/offers", label: "Offers", icon: "offers" },
  { href: "/admin/import", label: "CSV Import", icon: "import" },
  { href: "/admin/settings", label: "Settings", icon: "settings" },
];

export function getAdminPageTitle(pathname: string) {
  const match = adminNavigationItems.find((item) =>
    item.href === "/admin"
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  return match?.label ?? "Admin";
}

type AdminNavigationProps = {
  onNavigate?: () => void;
};

export function AdminNavigation({ onNavigate }: AdminNavigationProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin navigation">
      <ul className="space-y-1.5">
        {adminNavigationItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <li key={item.href}>
              <Link
                aria-current={isActive ? "page" : undefined}
                className={`flex min-h-11 items-center gap-3 rounded-[10px] px-3.5 py-2.5 text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050A14] motion-reduce:transition-none ${
                  isActive
                    ? "bg-[#2563EB] text-white shadow-sm"
                    : "text-[#D1D5DB] hover:bg-white/10 hover:text-white"
                }`}
                href={item.href}
                onClick={onNavigate}
              >
                <AdminIcon className="h-5 w-5 shrink-0" name={item.icon} />
                <span>{item.label}</span>
                {isActive ? (
                  <span
                    aria-hidden="true"
                    className="ml-auto h-2 w-2 rounded-full bg-white"
                  />
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
