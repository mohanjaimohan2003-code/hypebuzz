import type { Metadata } from "next";
import { AdminPlaceholderPage } from "@/components/admin/admin-placeholder-page";

export const metadata: Metadata = { title: "Offers | HypeBuzz Admin" };

export default function AdminOffersPage() {
  return (
    <AdminPlaceholderPage
      description="Review affiliate offers, price context, availability, and freshness."
      icon="offers"
      title="Offers"
    />
  );
}
