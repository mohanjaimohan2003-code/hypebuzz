"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { createBrand, updateBrand } from "@/app/admin/(protected)/brands/actions";
import {
  createBrandSlug,
  initialBrandActionState,
  type BrandField,
} from "@/lib/validation/brand";
import { BrandLogoPreview } from "./brand-logo-preview";

export type BrandFormInitialBrand = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string;
  isActive: boolean;
};

type BrandFormProps = { mode: "create" | "edit"; brand?: BrandFormInitialBrand };
const inputClass = "mt-2 min-h-12 w-full rounded-[10px] border border-[#D1D5DB] bg-white px-4 text-sm text-[#111827] outline-none transition-colors placeholder:text-[#6B7280] hover:border-[#9CA3AF] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[#F3F4F6] motion-reduce:transition-none";

function FieldError({ field, error }: { field: BrandField; error?: string }) {
  return error ? <p className="mt-2 text-sm font-medium text-[#B91C1C]" id={`${field}-error`}>{error}</p> : null;
}

export function BrandForm({ mode, brand }: BrandFormProps) {
  const [name, setName] = useState(brand?.name ?? "");
  const [slug, setSlug] = useState(brand?.slug ?? "");
  const [logoUrl, setLogoUrl] = useState(brand?.logoUrl ?? "");
  const [slugWasEdited, setSlugWasEdited] = useState(mode === "edit");
  const action = mode === "create" ? createBrand : updateBrand.bind(null, brand?.id ?? "");
  const [state, formAction, isPending] = useActionState(action, initialBrandActionState);

  function describedBy(field: BrandField, hintId?: string) {
    const errorId = state.fieldErrors[field] ? `${field}-error` : "";
    return [hintId, errorId].filter(Boolean).join(" ") || undefined;
  }

  return (
    <form action={formAction} className="mt-8 space-y-8">
      {state.status === "error" ? <div aria-live="polite" className="rounded-[10px] border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-3 text-sm font-medium text-[#991B1B]" role="alert">{state.message}</div> : null}
      <fieldset className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_2px_rgba(17,24,39,0.04)] sm:p-6">
        <legend className="px-1 text-lg font-bold text-[#111827]">Brand details</legend>
        <div className="mt-2 grid gap-6 lg:grid-cols-2">
          <div>
            <label className="text-sm font-semibold text-[#111827]" htmlFor="brand-name">Brand name</label>
            <input aria-describedby={describedBy("name")} aria-invalid={Boolean(state.fieldErrors.name)} autoComplete="off" className={inputClass} disabled={isPending} id="brand-name" maxLength={120} name="name" onChange={(event) => { const nextName = event.target.value; setName(nextName); if (!slugWasEdited) setSlug(createBrandSlug(nextName)); }} required value={name} />
            <FieldError error={state.fieldErrors.name} field="name" />
          </div>
          <div>
            <label className="text-sm font-semibold text-[#111827]" htmlFor="brand-slug">Slug</label>
            <input aria-describedby={describedBy("slug", "brand-slug-hint")} aria-invalid={Boolean(state.fieldErrors.slug)} autoCapitalize="none" autoComplete="off" className={inputClass} disabled={isPending} id="brand-slug" maxLength={160} name="slug" onChange={(event) => { setSlugWasEdited(true); setSlug(event.target.value); }} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required value={slug} />
            <p className="mt-2 text-xs leading-5 text-[#6B7280]" id="brand-slug-hint">Lowercase letters, numbers, and single hyphens only.</p>
            <FieldError error={state.fieldErrors.slug} field="slug" />
          </div>
          <div className="lg:col-span-2">
            <label className="text-sm font-semibold text-[#111827]" htmlFor="brand-logo-url">Logo URL <span className="font-normal text-[#6B7280]">(optional)</span></label>
            <div className="mt-2 grid gap-4 sm:grid-cols-[6rem_minmax(0,1fr)] sm:items-start">
              <BrandLogoPreview large logoUrl={logoUrl || null} name={name || "Brand"} />
              <div><input aria-describedby={describedBy("logoUrl", "brand-logo-url-hint")} aria-invalid={Boolean(state.fieldErrors.logoUrl)} className="min-h-12 w-full rounded-[10px] border border-[#D1D5DB] bg-white px-4 text-sm text-[#111827] outline-none transition-colors placeholder:text-[#6B7280] hover:border-[#9CA3AF] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[#F3F4F6] motion-reduce:transition-none" disabled={isPending} id="brand-logo-url" maxLength={2048} name="logoUrl" onChange={(event) => setLogoUrl(event.target.value)} placeholder="https://example.com/logo.png" type="url" value={logoUrl} /><p className="mt-2 text-xs leading-5 text-[#6B7280]" id="brand-logo-url-hint">The preview falls back safely when the URL is empty or unavailable.</p><FieldError error={state.fieldErrors.logoUrl} field="logoUrl" /></div>
            </div>
          </div>
        </div>
      </fieldset>
      <fieldset className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_2px_rgba(17,24,39,0.04)] sm:p-6">
        <legend className="px-1 text-lg font-bold text-[#111827]">Visibility</legend>
        <label className="mt-2 flex min-h-12 cursor-pointer items-start gap-3 rounded-[10px] border border-[#E5E7EB] p-4 hover:bg-[#F8FAFC] focus-within:ring-2 focus-within:ring-[#2563EB] focus-within:ring-offset-2"><input className="mt-0.5 h-5 w-5 rounded border-[#9CA3AF] accent-[#2563EB]" defaultChecked={brand?.isActive ?? true} disabled={isPending} name="isActive" type="checkbox" /><span><span className="block text-sm font-semibold text-[#111827]">Active brand</span><span className="mt-1 block text-xs leading-5 text-[#6B7280]">Active brands may appear on public catalog surfaces.</span></span></label>
      </fieldset>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Link className="inline-flex min-h-12 items-center justify-center rounded-[10px] border border-[#D1D5DB] bg-white px-5 text-sm font-semibold text-[#111827] hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2" href="/admin/brands">Cancel</Link><button className="inline-flex min-h-12 items-center justify-center rounded-[10px] bg-[#2563EB] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#1D4ED8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[#93C5FD] motion-reduce:transition-none" disabled={isPending} type="submit">{isPending ? "Saving..." : mode === "create" ? "Create Brand" : "Save Changes"}</button></div>
    </form>
  );
}
