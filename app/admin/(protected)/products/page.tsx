import type { Metadata } from "next";
import { AdminPlaceholderPage } from "@/components/admin/admin-placeholder-page";

export const metadata: Metadata = { title: "Products | HypeBuzz Admin" };

export default function AdminProductsPage() {
  return (
    <AdminPlaceholderPage
      description="Manage product records, publication status, content, and catalog relationships."
      icon="products"
      title="Products"
    />
  );
}
