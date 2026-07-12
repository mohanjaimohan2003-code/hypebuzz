import { redirect } from "next/navigation";
import { getAdminAccess } from "@/lib/auth/admin";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const access = await getAdminAccess();

  if (access.status === "unauthenticated") redirect("/admin/login");
  if (access.status === "denied") redirect("/admin/access-denied");

  return children;
}
