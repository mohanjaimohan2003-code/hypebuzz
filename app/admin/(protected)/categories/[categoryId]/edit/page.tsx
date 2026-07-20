import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { CategoryForm } from "@/components/admin/category-form";
import { getAdminCategory } from "@/lib/data/admin-categories";

export const metadata: Metadata = { title: "Edit Category | HypeBuzz Admin" };

export default async function EditCategoryPage({ params }: { params: Promise<{ categoryId: string }> }) {
  const { categoryId } = await params;
  const { category, hasError } = await getAdminCategory(categoryId);
  if (!category && !hasError) notFound();
  if (!category) {
    return <div className="rounded-2xl border border-[#E5E7EB] bg-white"><AdminEmptyState actionHref="/admin/categories" actionLabel="Return to Categories" description="The category data could not be loaded safely. Try again after checking the Supabase connection." title="Unable to load category" /></div>;
  }

  return (
    <div className="mx-auto max-w-5xl">
      <Link className="inline-flex min-h-11 items-center rounded-[10px] px-2 text-sm font-semibold text-[#1D4ED8] hover:bg-[#EFF6FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2" href="/admin/categories">&larr; Back to categories</Link>
      <header className="mt-4">
        <p className="text-sm font-semibold text-[#2563EB]">Catalog management</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#111827] sm:text-4xl">Edit Category</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-[#6B7280]">Update category details and visibility for <strong className="font-semibold text-[#111827]">{category.name}</strong>.</p>
      </header>
      <CategoryForm category={{ id: category.id, name: category.name, slug: category.slug, description: category.description ?? "", iconUrl: category.image_url ?? "", displayOrder: category.display_order, isActive: category.is_active }} mode="edit" />
    </div>
  );
}
