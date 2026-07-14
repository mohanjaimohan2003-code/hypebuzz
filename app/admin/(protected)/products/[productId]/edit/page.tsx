import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { ProductForm } from "@/components/admin/product-form";
import { getAdminProductEditorData } from "@/lib/data/admin-products";

export const metadata: Metadata = { title: "Edit Product | HypeBuzz Admin" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const { product, categories, hasError } = await getAdminProductEditorData(productId);

  if (!product && !hasError) notFound();

  if (!product) {
    return (
      <div className="rounded-2xl border border-[#E5E7EB] bg-white">
        <AdminEmptyState
          actionHref="/admin/products"
          actionLabel="Return to Products"
          description="The product data could not be loaded safely. Try again after checking the Supabase connection."
          title="Unable to load product"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <Link className="inline-flex min-h-11 items-center rounded-[10px] px-2 text-sm font-semibold text-[#1D4ED8] hover:bg-[#EFF6FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2" href="/admin/products">← Back to products</Link>
      <header className="mt-4">
        <p className="text-sm font-semibold text-[#2563EB]">Catalog management</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#111827] sm:text-4xl">Edit Product</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-[#6B7280]">Update product content and publication settings for <strong className="font-semibold text-[#111827]">{product.name}</strong>.</p>
      </header>

      {hasError || categories.length === 0 ? (
        <div className="mt-6 rounded-[10px] border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-3 text-sm font-medium text-[#991B1B]" role="alert">
          Categories could not be loaded. Product changes are disabled until category access is restored.
        </div>
      ) : null}

      <ProductForm
        categories={categories}
        mode="edit"
        product={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          shortDescription: product.short_description ?? "",
          categoryId: product.category_id ?? "",
          imageUrl: product.primary_image_url ?? "",
          isFeatured: product.is_featured,
          isTrending: product.is_trending,
          status: product.status,
        }}
      />
    </div>
  );
}
