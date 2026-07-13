import type { Metadata } from "next";
import { AdminPlaceholderPage } from "@/components/admin/admin-placeholder-page";

export const metadata: Metadata = { title: "Merchants | HypeBuzz Admin" };

export default function AdminMerchantsPage() {
  return (
    <AdminPlaceholderPage
      description="Manage approved merchants and the destinations presented to shoppers."
      icon="merchants"
      title="Merchants"
    />
  );
}
