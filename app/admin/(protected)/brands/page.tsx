import type { Metadata } from "next";
import { AdminPlaceholderPage } from "@/components/admin/admin-placeholder-page";

export const metadata: Metadata = { title: "Brands | HypeBuzz Admin" };

export default function AdminBrandsPage() {
  return (
    <AdminPlaceholderPage
      description="Maintain trusted brand identities and their catalog associations."
      icon="brands"
      title="Brands"
    />
  );
}
