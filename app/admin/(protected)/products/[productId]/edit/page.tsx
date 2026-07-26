import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { ProductForm } from "@/components/admin/product-form";
import { getAdminProductEditorData } from "@/lib/data/admin-products";
import { normalizeHighlights, normalizeSpecifications } from "@/lib/products/rich-fields";

export const metadata: Metadata = { title: "Edit Product | HypeBuzz Admin" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const { product, categories, brands, merchants, offer, offers, images, hasError } = await getAdminProductEditorData(productId);

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
        brands={brands}
        categories={categories}
        merchants={merchants}
        mode="edit"
        product={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          shortDescription: product.short_description ?? "",
          longDescription: product.description ?? "",
          highlights: normalizeHighlights(product.highlights).value,
          specifications: normalizeSpecifications(product.specifications).value,
          seoTitle: product.seo_title ?? "",
          seoDescription: product.seo_description ?? "",
          categoryId: product.category_id ?? "",
          brandId: product.brand_id ?? "",
          imageUrl: product.primary_image_url ?? "",
          images,
          isFeatured: product.is_featured,
          isTrending: product.is_trending,
          status: product.status,
          offerId: offer?.id ?? null,
          merchantId: offer?.merchant_id ?? "",
          affiliateUrl: offer?.affiliate_url ?? "",
          currentPrice: offer ? Number(offer.current_price) : null,
          originalPrice: offer?.original_price === null || offer?.original_price === undefined ? null : Number(offer.original_price),
          currency: offer?.currency ?? "INR",
          stockStatus: offer?.availability === "limited_stock" || offer?.availability === "out_of_stock" ? offer.availability : "in_stock",
          offerIsActive: offer?.is_active ?? true,
          offers: offers.map((item) => ({ id: item.id, persisted: true, merchantId: item.merchant_id, affiliateUrl: item.affiliate_url, currentPrice: Number(item.current_price), originalPrice: item.original_price === null ? null : Number(item.original_price), currency: item.currency, stockStatus: item.availability === "limited_stock" || item.availability === "out_of_stock" || item.availability === "pre_order" || item.availability === "unknown" ? item.availability : "in_stock", isActive: item.is_active, couponCode: item.coupon_note ?? "", shippingNote: item.shipping_note ?? "", offerTitle: item.offer_title ?? "", lastCheckedAt: item.last_checked_at ? new Date(item.last_checked_at).toISOString().slice(0, 16) : "" })),
        }}
      />
    </div>
  );
}
