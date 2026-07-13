"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminIcon } from "./admin-icon";
import { AdminMobileNavigation } from "./admin-mobile-navigation";
import { getAdminPageTitle } from "./admin-navigation";
import { AdminSignOutButton } from "./admin-sign-out-button";

export function AdminTopbar() {
  const pathname = usePathname();
  const title = getAdminPageTitle(pathname);

  return (
    <header className="sticky top-0 z-30 border-b border-[#E5E7EB] bg-white shadow-[0_1px_3px_rgba(17,24,39,0.05)]">
      <div className="flex min-h-16 items-center gap-3 px-4 sm:px-6 lg:min-h-[72px] lg:px-8">
        <AdminMobileNavigation />

        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-[0.16em] text-[#2563EB] uppercase">
            Admin
          </p>
          <p className="truncate text-lg font-bold text-[#111827]">{title}</p>
        </div>

        <div className="ml-auto hidden items-center gap-2 sm:flex">
          <Link
            className="flex min-h-11 items-center gap-2 rounded-[10px] border border-[#E5E7EB] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#111827] transition-colors duration-150 hover:border-[#2563EB] hover:bg-[#EFF6FF] hover:text-[#1D4ED8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 motion-reduce:transition-none"
            href="/"
          >
            <AdminIcon className="h-5 w-5" name="website" />
            <span className="hidden md:inline">View Website</span>
          </Link>
          <AdminSignOutButton />
        </div>
      </div>
    </header>
  );
}
