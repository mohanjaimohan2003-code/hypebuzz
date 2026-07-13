import type { Metadata } from "next";
import { AdminPlaceholderPage } from "@/components/admin/admin-placeholder-page";

export const metadata: Metadata = { title: "CSV Import | HypeBuzz Admin" };

export default function AdminImportPage() {
  return (
    <AdminPlaceholderPage
      description="Prepare validated catalog data for a future controlled bulk-import workflow."
      icon="import"
      title="CSV Import"
    />
  );
}
