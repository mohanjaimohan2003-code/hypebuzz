import type { Metadata } from "next";
import { AdminPlaceholderPage } from "@/components/admin/admin-placeholder-page";

export const metadata: Metadata = { title: "Categories | HypeBuzz Admin" };

export default function AdminCategoriesPage() {
  return (
    <AdminPlaceholderPage
      description="Organize the catalog with clear, shopper-friendly product categories."
      icon="categories"
      title="Categories"
    />
  );
}
