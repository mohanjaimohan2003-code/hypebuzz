import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { BrandForm } from "@/components/admin/brand-form";
import { getAdminBrand } from "@/lib/data/admin-brands";

export const metadata: Metadata = { title: "Edit Brand | HypeBuzz Admin" };

export default async function EditBrandPage({ params }: { params: Promise<{ brandId: string }> }) {
  const { brandId } = await params;
  const { brand, hasError } = await getAdminBrand(brandId);
  if (!brand && !hasError) notFound();
  if (!brand) return <div className="rounded-2xl border border-[#E5E7EB] bg-white"><AdminEmptyState actionHref="/admin/brands" actionLabel="Return to Brands" description="The brand data could not be loaded safely. Try again after checking the Supabase connection." title="Unable to load brand" /></div>;

  return (
    <div className="mx-auto max-w-5xl">
      <Link className="inline-flex min-h-11 items-center rounded-[10px] px-2 text-sm font-semibold text-[#1D4ED8] hover:bg-[#EFF6FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2" href="/admin/brands">&larr; Back to brands</Link>
      <header className="mt-4"><p className="text-sm font-semibold text-[#2563EB]">Catalog management</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-[#111827] sm:text-4xl">Edit Brand</h1><p className="mt-3 max-w-2xl text-base leading-7 text-[#6B7280]">Update brand identity and visibility for <strong className="font-semibold text-[#111827]">{brand.name}</strong>.</p></header>
      <BrandForm brand={{ id: brand.id, name: brand.name, slug: brand.slug, logoUrl: brand.logo_url ?? "", isActive: brand.is_active }} mode="edit" />
    </div>
  );
}
