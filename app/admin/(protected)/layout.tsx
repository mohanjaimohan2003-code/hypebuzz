import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { getAdminAccess } from "@/lib/auth/admin";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const access = await getAdminAccess();

  if (access.status === "unauthenticated") redirect("/admin/login");
  if (access.status === "denied") redirect("/admin/access-denied");

  return (
    <div className="min-h-dvh flex-1 overflow-x-hidden bg-[#F8FAFC] text-[#111827]">
      <a
        className="sr-only rounded-[10px] bg-white px-4 py-3 font-semibold text-[#111827] shadow-lg focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
        href="#admin-main-content"
      >
        Skip to admin content
      </a>
      <AdminSidebar />
      <div className="min-w-0 lg:pl-64">
        <AdminTopbar />
        <main
          className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
          id="admin-main-content"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
