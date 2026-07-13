import type { Metadata } from "next";
import { AdminPlaceholderPage } from "@/components/admin/admin-placeholder-page";

export const metadata: Metadata = { title: "Settings | HypeBuzz Admin" };

export default function AdminSettingsPage() {
  return (
    <AdminPlaceholderPage
      description="Configure future admin preferences and operational settings safely."
      icon="settings"
      title="Settings"
    />
  );
}
