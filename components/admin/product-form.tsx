"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import {
  createProduct,
  resolveOrCreateImportedBrand,
  updateProduct,
} from "@/app/admin/(protected)/products/actions";
import type { AdminBrandOption, AdminCategoryOption, AdminMerchantOption } from "@/lib/data/admin-products";
import type { ProductStatus } from "@/lib/types/database";
import type { ProductImportApplication } from "@/lib/admin/product-import/types";
import {
  createProductSlug,
  initialProductActionState,
  type ProductField,
} from "@/lib/validation/product";
import { ProductImagesField, type ProductImageValue } from "./product-images-field";
import { ProductJsonImporter } from "./product-json-importer";
import { ProductOffersField, type ProductOffersFieldHandle, type ProductOfferValue } from "./product-offers-field";
import { ProductHighlightsField } from "./product-highlights-field";
import { ProductSpecificationsField, specificationsToRows, type SpecificationRow } from "./product-specifications-field";

export type ProductFormInitialProduct = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  longDescription: string;
  highlights: string[];
  specifications: Record<string, string>;
  seoTitle: string;
  seoDescription: string;
  categoryId: string;
  brandId: string;
  imageUrl: string;
  images: ProductImageValue[];
  isFeatured: boolean;
  isTrending: boolean;
  status: ProductStatus;
  offerId: string | null;
  merchantId: string;
  affiliateUrl: string;
  currentPrice: number | null;
  originalPrice: number | null;
  currency: string;
  stockStatus: "in_stock" | "limited_stock" | "out_of_stock";
  offerIsActive: boolean;
  offers: ProductOfferValue[];
};

type ProductFormProps = {
  mode: "create" | "edit";
  categories: AdminCategoryOption[];
  brands: AdminBrandOption[];
  merchants: AdminMerchantOption[];
  product?: ProductFormInitialProduct;
};

const inputClass = "mt-2 min-h-12 w-full rounded-[10px] border border-[#D1D5DB] bg-white px-4 text-sm text-[#111827] outline-none transition-colors placeholder:text-[#6B7280] hover:border-[#9CA3AF] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[#F3F4F6] motion-reduce:transition-none";
const fieldElementIds: Partial<Record<ProductField, string>> = { name:"product-name",slug:"product-slug",shortDescription:"product-description",categoryId:"product-category",brandId:"product-brand",longDescription:"product-long-description",highlights:"product-highlights-section",specifications:"product-specifications-section",imageUrl:"product-images-section",merchantId:"product-offer-merchant-0",affiliateUrl:"product-offer-url-0",currentPrice:"product-offer-current-0",originalPrice:"product-offer-original-0",currency:"product-offer-currency-0",stockStatus:"product-offer-stock-0",offerList:"product-offers-section",status:"product-status",seoTitle:"product-seo-title",seoDescription:"product-seo-description" };

function FieldError({ field, error }: { field: ProductField; error?: string }) {
  return error ? <p className="mt-2 text-sm font-medium text-[#B91C1C]" id={`${field}-error`}>{error}</p> : null;
}

export function ProductForm({ mode, categories, brands, merchants, product }: ProductFormProps) {
  const [availableBrands, setAvailableBrands] = useState(brands);
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [shortDescription, setShortDescription] = useState(product?.shortDescription ?? "");
  const [longDescription, setLongDescription] = useState(product?.longDescription ?? "");
  const [highlights, setHighlights] = useState(product?.highlights ?? []);
  const [specificationRows, setSpecificationRows] = useState<SpecificationRow[]>(specificationsToRows(product?.specifications ?? {}));
  const [seoTitle, setSeoTitle] = useState(product?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(product?.seoDescription ?? "");
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? "");
  const [importedSubcategory, setImportedSubcategory] = useState("");
  const [brandId, setBrandId] = useState(product?.brandId ?? "");
  const [status, setStatus] = useState<"draft" | "published">(product?.status === "published" ? "published" : "draft");
  const [isFeatured, setIsFeatured] = useState(product?.isFeatured ?? false);
  const [isTrending, setIsTrending] = useState(product?.isTrending ?? false);
  const [slugWasEdited, setSlugWasEdited] = useState(mode === "edit");
  const detailsRef = useRef<HTMLFieldSetElement>(null);
  const richDetailsRef = useRef<HTMLDetailsElement>(null);
  const seoDetailsRef = useRef<HTMLDetailsElement>(null);
  const offersRef = useRef<ProductOffersFieldHandle>(null);
  const action = mode === "create" ? createProduct : updateProduct.bind(null, product?.id ?? "");
  const [state, formAction, isPending] = useActionState(action, initialProductActionState);
  const validationErrors = state.validationErrors?.map(({ field, message }) => [field, message] as [ProductField, string])
    ?? Object.entries(state.fieldErrors) as Array<[ProductField, string]>;
  const uniqueValidationErrors = validationErrors.filter(([field, reason], index, all) => all.findIndex(([, candidate]) => candidate === reason) === index && Boolean(field));
  const showValidationBanner = Boolean(state.validationMode && uniqueValidationErrors.length > 0);
  const showGeneralError = state.status === "error" && !state.validationMode;

  useEffect(() => {
    const currentErrors = Object.entries(state.fieldErrors) as Array<[ProductField, string]>;
    if (state.status !== "error" || currentErrors.length === 0) return;
    if (currentErrors.some(([field]) => ["longDescription","highlights","specifications"].includes(field))) richDetailsRef.current?.setAttribute("open", "");
    if (currentErrors.some(([field]) => ["seoTitle","seoDescription"].includes(field))) seoDetailsRef.current?.setAttribute("open", "");
    const firstId = fieldElementIds[currentErrors[0][0]];
    const element = firstId ? document.getElementById(firstId) : null;
    requestAnimationFrame(() => { element?.scrollIntoView({ behavior:"smooth",block:"center" }); element?.focus({ preventScroll:true }); });
  }, [state.status, state.fieldErrors]);

  function describedBy(field: ProductField, hintId?: string) {
    const errorId = state.fieldErrors[field] ? `${field}-error` : "";
    return [hintId, errorId].filter(Boolean).join(" ") || undefined;
  }

  function applyImport(imported: ProductImportApplication) {
    if (imported.productName !== undefined) setName(imported.productName);
    if (imported.slug !== undefined) { setSlug(imported.slug); setSlugWasEdited(true); }
    if (imported.shortDescription !== undefined) setShortDescription(imported.shortDescription);
    if (imported.longDescription !== undefined) setLongDescription(imported.longDescription);
    if (imported.highlights !== undefined) setHighlights(imported.highlights);
    if (imported.specifications !== undefined) setSpecificationRows(specificationsToRows(imported.specifications));
    if (imported.seoTitle !== undefined) setSeoTitle(imported.seoTitle);
    if (imported.seoDescription !== undefined) setSeoDescription(imported.seoDescription);
    if (imported.categoryId !== undefined) setCategoryId(imported.categoryId);
    if (imported.subcategory !== undefined) setImportedSubcategory(imported.subcategory);
    if (imported.brandId !== undefined) setBrandId(imported.brandId);
    setStatus(imported.status);
    if (imported.featuredProduct !== undefined) setIsFeatured(imported.featuredProduct);
    if (imported.trendingProduct !== undefined) setIsTrending(imported.trendingProduct);
    if (imported.offer) offersRef.current?.applyImport(imported.offer);
    requestAnimationFrame(() => detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function addResolvedBrand(brand: AdminBrandOption) {
    setAvailableBrands((current) => current.some((item) => item.id === brand.id) ? current : [...current, brand].sort((a, b) => a.name.localeCompare(b.name)));
  }

  return (
    <form action={formAction} className="mt-8 space-y-8" noValidate>
      {product?.status === "archived" ? (
        <div className="rounded-[10px] border border-[#D1D5DB] bg-[#F3F4F6] px-4 py-3 text-sm text-[#374151]">
          This product is archived. Saving it as Draft or Published will reactivate it.
        </div>
      ) : null}

      {showValidationBanner || showGeneralError ? (
        <div aria-live="polite" className="rounded-[10px] border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-3 text-sm font-medium text-[#991B1B]" role="alert">
          <p className="font-bold">{state.message}</p>
          {showValidationBanner ? <ul className="mt-2 list-disc space-y-1 pl-5">{uniqueValidationErrors.map(([field, reason]) => <li key={field}><a className="underline underline-offset-2" href={`#${fieldElementIds[field] ?? "product-form-errors"}`}>{reason}</a></li>)}</ul> : null}
        </div>
      ) : null}

      {mode === "create" ? (
        <ProductJsonImporter brands={availableBrands} categories={categories} merchants={merchants} onApply={applyImport} onBrandResolved={addResolvedBrand} resolveBrand={resolveOrCreateImportedBrand} />
      ) : null}

      <fieldset className="scroll-mt-24 rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_2px_rgba(17,24,39,0.04)] sm:p-6" ref={detailsRef}>
        <legend className="px-1 text-lg font-bold text-[#111827]">Product details</legend>
        <div className="mt-2 grid gap-6 lg:grid-cols-2">
          <div>
            <label className="text-sm font-semibold text-[#111827]" htmlFor="product-name">Product name</label>
            <input
              aria-describedby={describedBy("name")}
              aria-invalid={Boolean(state.fieldErrors.name)}
              className={inputClass}
              disabled={isPending}
              id="product-name"
              maxLength={160}
              name="name"
              onChange={(event) => {
                const nextName = event.target.value;
                setName(nextName);
                if (!slugWasEdited) setSlug(createProductSlug(nextName));
              }}
              required
              value={name}
            />
            <FieldError error={state.fieldErrors.name} field="name" />
          </div>

          <div>
            <label className="text-sm font-semibold text-[#111827]" htmlFor="product-slug">Slug</label>
            <input
              aria-describedby={describedBy("slug", "slug-hint")}
              aria-invalid={Boolean(state.fieldErrors.slug)}
              autoCapitalize="none"
              className={inputClass}
              disabled={isPending}
              id="product-slug"
              maxLength={160}
              name="slug"
              onChange={(event) => {
                setSlugWasEdited(true);
                setSlug(event.target.value.toLowerCase());
              }}
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              required
              value={slug}
            />
            <p className="mt-2 text-xs text-[#6B7280]" id="slug-hint">Lowercase letters, numbers, and hyphens only.</p>
            <FieldError error={state.fieldErrors.slug} field="slug" />
          </div>

          <div className="lg:col-span-2">
            <label className="text-sm font-semibold text-[#111827]" htmlFor="product-description">Short description</label>
            <textarea
              aria-describedby={describedBy("shortDescription", "description-hint")}
              aria-invalid={Boolean(state.fieldErrors.shortDescription)}
              className={`${inputClass} min-h-28 py-3`}
              disabled={isPending}
              id="product-description"
              maxLength={300}
              name="shortDescription"
              onChange={(event) => setShortDescription(event.target.value)}
              value={shortDescription}
            />
            <p className="mt-2 text-xs text-[#6B7280]" id="description-hint">Optional, up to 300 characters.</p>
            <FieldError error={state.fieldErrors.shortDescription} field="shortDescription" />
          </div>

          <div>
            <label className="text-sm font-semibold text-[#111827]" htmlFor="product-category">Category</label>
            <select
              aria-describedby={describedBy("categoryId")}
              aria-invalid={Boolean(state.fieldErrors.categoryId)}
              className={inputClass}
              disabled={isPending || categories.length === 0}
              id="product-category"
              name="categoryId"
              onChange={(event) => setCategoryId(event.target.value)}
              required
              value={categoryId}
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}{category.isActive ? "" : " (inactive)"}
                </option>
              ))}
            </select>
            <FieldError error={state.fieldErrors.categoryId} field="categoryId" />
            {importedSubcategory ? <p className="mt-2 text-xs text-[#4B5563]">Imported subcategory: <span className="font-semibold text-[#111827]">{importedSubcategory}</span></p> : null}
          </div>

          <div>
            <label className="text-sm font-semibold text-[#111827]" htmlFor="product-brand">Brand</label>
            <select aria-describedby={describedBy("brandId")} aria-invalid={Boolean(state.fieldErrors.brandId)} className={inputClass} disabled={isPending} id="product-brand" name="brandId" onChange={(event) => setBrandId(event.target.value)} value={brandId}>
              <option value="">No brand</option>
              {availableBrands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}{brand.isActive ? "" : " (inactive)"}</option>)}
            </select>
            <FieldError error={state.fieldErrors.brandId} field="brandId" />
          </div>

        </div>
      </fieldset>

      <details className="rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_1px_2px_rgba(17,24,39,0.04)]" open ref={richDetailsRef}>
        <summary className="min-h-14 cursor-pointer px-5 py-4 text-lg font-bold text-[#111827] sm:px-6">Rich product content</summary>
        <div className="space-y-7 border-t border-[#E5E7EB] p-5 sm:p-6">
          <div>
            <label className="text-sm font-semibold" htmlFor="product-long-description">Long Description</label>
            <textarea className={`${inputClass} min-h-40 py-3`} disabled={isPending} id="product-long-description" maxLength={10000} name="longDescription" onChange={(event) => setLongDescription(event.target.value)} value={longDescription} />
            <div className="mt-2 flex justify-between gap-3 text-xs text-[#6B7280]"><span>Plain text only.</span><span>{longDescription.length.toLocaleString()} / 10,000</span></div>
            <FieldError error={state.fieldErrors.longDescription} field="longDescription" />
          </div>
          <div id="product-highlights-section" tabIndex={-1}>
            <h3 className="text-sm font-semibold">Highlights</h3>
            <input name="highlightsManifest" type="hidden" value={JSON.stringify(highlights)} />
            <div className="mt-3"><ProductHighlightsField disabled={isPending} error={state.fieldErrors.highlights} onChange={setHighlights} values={highlights} /></div>
          </div>
          <div id="product-specifications-section" tabIndex={-1}>
            <h3 className="text-sm font-semibold">Specifications</h3>
            <input name="specificationsManifest" type="hidden" value={JSON.stringify(specificationRows.map(({ label, value }) => ({ label, value })))} />
            <div className="mt-3"><ProductSpecificationsField disabled={isPending} error={state.fieldErrors.specifications} onChange={setSpecificationRows} rows={specificationRows} /></div>
          </div>
        </div>
      </details>

      <ProductImagesField disabled={isPending} error={state.fieldErrors.imageUrl} initialImages={product?.images ?? []} />

      <ProductOffersField disabled={isPending} error={state.fieldErrors.offerList} fieldErrors={state.fieldErrors} initialOffers={product?.offers ?? []} merchants={merchants} ref={offersRef} />

      <fieldset className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_2px_rgba(17,24,39,0.04)] sm:p-6">
        <legend className="px-1 text-lg font-bold text-[#111827]">Publishing</legend>
        <div className="mt-2 grid gap-6 lg:grid-cols-2">
          <div>
            <label className="text-sm font-semibold text-[#111827]" htmlFor="product-status">Status</label>
            <select
              aria-describedby={describedBy("status")}
              aria-invalid={Boolean(state.fieldErrors.status)}
              className={inputClass}
              disabled={isPending}
              id="product-status"
              name="status"
              onChange={(event) => setStatus(event.target.value as "draft" | "published")}
              required
              value={status}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
            <FieldError error={state.fieldErrors.status} field="status" />
          </div>

          <div className="space-y-3">
            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[10px] border border-[#E5E7EB] px-4 py-2 text-sm font-semibold text-[#111827] hover:bg-[#F8FAFC]">
              <input checked={isFeatured} className="h-5 w-5 accent-[#2563EB]" disabled={isPending} name="isFeatured" onChange={(event) => setIsFeatured(event.target.checked)} type="checkbox" />
              Featured product
            </label>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[10px] border border-[#E5E7EB] px-4 py-2 text-sm font-semibold text-[#111827] hover:bg-[#F8FAFC]">
              <input checked={isTrending} className="h-5 w-5 accent-[#2563EB]" disabled={isPending} name="isTrending" onChange={(event) => setIsTrending(event.target.checked)} type="checkbox" />
              Trending product
            </label>
          </div>
        </div>
      </fieldset>

      <details className="rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_1px_2px_rgba(17,24,39,0.04)]" ref={seoDetailsRef}>
        <summary className="min-h-14 cursor-pointer px-5 py-4 text-lg font-bold text-[#111827] sm:px-6">Search appearance</summary>
        <div className="grid gap-6 border-t border-[#E5E7EB] p-5 sm:p-6 lg:grid-cols-2">
          <div>
            <label className="text-sm font-semibold" htmlFor="product-seo-title">SEO Title</label>
            <input className={inputClass} disabled={isPending} id="product-seo-title" maxLength={200} name="seoTitle" onChange={(event) => setSeoTitle(event.target.value)} value={seoTitle} />
            <p className={`mt-2 text-xs ${seoTitle.length > 60 ? "text-[#B45309]" : "text-[#6B7280]"}`}>{seoTitle.length} characters; approximately 50–60 is recommended.</p>
            <FieldError error={state.fieldErrors.seoTitle} field="seoTitle" />
          </div>
          <div>
            <label className="text-sm font-semibold" htmlFor="product-seo-description">SEO Description</label>
            <textarea className={`${inputClass} min-h-28 py-3`} disabled={isPending} id="product-seo-description" maxLength={500} name="seoDescription" onChange={(event) => setSeoDescription(event.target.value)} value={seoDescription} />
            <p className={`mt-2 text-xs ${seoDescription.length > 160 ? "text-[#B45309]" : "text-[#6B7280]"}`}>{seoDescription.length} characters; approximately 150–160 is recommended.</p>
            <FieldError error={state.fieldErrors.seoDescription} field="seoDescription" />
          </div>
        </div>
      </details>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link className="inline-flex min-h-12 items-center justify-center rounded-[10px] border border-[#D1D5DB] bg-white px-5 text-sm font-semibold text-[#111827] transition-colors hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 motion-reduce:transition-none" href="/admin/products">Cancel</Link>
        <button className="inline-flex min-h-12 items-center justify-center rounded-[10px] bg-[#2563EB] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#1D4ED8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[#93C5FD] motion-reduce:transition-none" disabled={isPending || categories.length === 0 || merchants.length === 0} type="submit">
          {isPending ? "Saving…" : mode === "create" ? "Create product" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
