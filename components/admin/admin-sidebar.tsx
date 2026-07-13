import Image from "next/image";
import Link from "next/link";
import { AdminIcon } from "./admin-icon";
import { AdminNavigation } from "./admin-navigation";
import { AdminSignOutButton } from "./admin-sign-out-button";

export function AdminSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col overflow-y-auto bg-[#050A14] text-white lg:flex">
      <div className="border-b border-white/10 px-5 py-5">
        <Link
          aria-label="HypeBuzz admin dashboard"
          className="inline-flex min-h-11 items-center rounded-[10px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050A14]"
          href="/admin"
        >
          <Image
            alt="HypeBuzz"
            className="h-auto w-36"
            height={887}
            priority
            src="/brand/hypebuzz-navbar-logo.png"
            width={1776}
          />
        </Link>
        <p className="mt-2 text-xs font-semibold tracking-[0.18em] text-[#93C5FD] uppercase">
          Admin workspace
        </p>
      </div>

      <div className="flex-1 px-4 py-5">
        <AdminNavigation />
      </div>

      <div className="space-y-2 border-t border-white/10 p-4">
        <Link
          className="flex min-h-11 items-center gap-3 rounded-[10px] px-3.5 py-2.5 text-sm font-semibold text-[#D1D5DB] transition-colors duration-150 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050A14] motion-reduce:transition-none"
          href="/"
        >
          <AdminIcon className="h-5 w-5" name="website" />
          <span>View Website</span>
        </Link>
        <AdminSignOutButton variant="sidebar" />
      </div>
    </aside>
  );
}
