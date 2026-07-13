import { redirect } from "next/navigation";
import { getAdminAccess } from "@/lib/auth/admin";
import { AdminIcon, type AdminIconName } from "./admin-icon";

type AdminPlaceholderPageProps = {
  title: string;
  description: string;
  icon: AdminIconName;
};

export async function AdminPlaceholderPage({
  title,
  description,
  icon,
}: AdminPlaceholderPageProps) {
  const access = await getAdminAccess();

  if (access.status === "unauthenticated") redirect("/admin/login");
  if (access.status === "denied") redirect("/admin/access-denied");

  return (
    <div className="mx-auto max-w-5xl">
      <header>
        <p className="text-sm font-semibold text-[#2563EB]">Admin workspace</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#111827] sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-[#6B7280]">
          {description}
        </p>
      </header>

      <section className="mt-8 rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-[0_1px_2px_rgba(17,24,39,0.04)] sm:p-8">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EFF6FF] text-[#1D4ED8]">
          <AdminIcon className="h-6 w-6" name={icon} />
        </span>
        <h2 className="mt-5 text-xl font-semibold text-[#111827]">
          Coming in the next task
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6B7280]">
          This protected page is ready for its management workflow. No create,
          edit, or delete operations have been enabled yet.
        </p>
      </section>
    </div>
  );
}
