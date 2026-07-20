"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { createMerchant, updateMerchant } from "@/app/admin/(protected)/merchants/actions";
import {
  affiliateNetworks,
  createMerchantSlug,
  initialMerchantActionState,
  type AffiliateNetwork,
  type MerchantField,
} from "@/lib/validation/merchant";
import { MerchantLogoPreview } from "./merchant-logo-preview";

export type MerchantFormInitialMerchant = {
  id: string;
  name: string;
  slug: string;
  websiteUrl: string;
  logoUrl: string;
  affiliateNetwork: AffiliateNetwork;
  affiliateTrackingParameter: string;
  isActive: boolean;
};

type MerchantFormProps = {
  mode: "create" | "edit";
  merchant?: MerchantFormInitialMerchant;
};

const inputClass = "mt-2 min-h-12 w-full rounded-[10px] border border-[#D1D5DB] bg-white px-4 text-sm text-[#111827] outline-none transition-colors placeholder:text-[#6B7280] hover:border-[#9CA3AF] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[#F3F4F6] motion-reduce:transition-none";

function FieldError({ field, error }: { field: MerchantField; error?: string }) {
  return error ? <p className="mt-2 text-sm font-medium text-[#B91C1C]" id={`${field}-error`}>{error}</p> : null;
}

export function MerchantForm({ mode, merchant }: MerchantFormProps) {
  const [name, setName] = useState(merchant?.name ?? "");
  const [slug, setSlug] = useState(merchant?.slug ?? "");
  const [logoUrl, setLogoUrl] = useState(merchant?.logoUrl ?? "");
  const [slugWasEdited, setSlugWasEdited] = useState(mode === "edit");
  const action = mode === "create" ? createMerchant : updateMerchant.bind(null, merchant?.id ?? "");
  const [state, formAction, isPending] = useActionState(action, initialMerchantActionState);

  function describedBy(field: MerchantField, hintId?: string) {
    const errorId = state.fieldErrors[field] ? `${field}-error` : "";
    return [hintId, errorId].filter(Boolean).join(" ") || undefined;
  }

  return (
    <form action={formAction} className="mt-8 space-y-8">
      {state.status === "error" ? <div aria-live="polite" className="rounded-[10px] border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-3 text-sm font-medium text-[#991B1B]" role="alert">{state.message}</div> : null}

      <fieldset className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_2px_rgba(17,24,39,0.04)] sm:p-6">
        <legend className="px-1 text-lg font-bold text-[#111827]">Merchant details</legend>
        <div className="mt-2 grid gap-6 lg:grid-cols-2">
          <div>
            <label className="text-sm font-semibold text-[#111827]" htmlFor="merchant-name">Merchant name</label>
            <input aria-describedby={describedBy("name")} aria-invalid={Boolean(state.fieldErrors.name)} autoComplete="off" className={inputClass} disabled={isPending} id="merchant-name" maxLength={120} name="name" onChange={(event) => { const nextName = event.target.value; setName(nextName); if (!slugWasEdited) setSlug(createMerchantSlug(nextName)); }} required value={name} />
            <FieldError error={state.fieldErrors.name} field="name" />
          </div>
          <div>
            <label className="text-sm font-semibold text-[#111827]" htmlFor="merchant-slug">Slug</label>
            <input aria-describedby={describedBy("slug", "merchant-slug-hint")} aria-invalid={Boolean(state.fieldErrors.slug)} autoCapitalize="none" autoComplete="off" className={inputClass} disabled={isPending} id="merchant-slug" maxLength={160} name="slug" onChange={(event) => { setSlugWasEdited(true); setSlug(event.target.value); }} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required value={slug} />
            <p className="mt-2 text-xs leading-5 text-[#6B7280]" id="merchant-slug-hint">Lowercase letters, numbers, and single hyphens only.</p>
            <FieldError error={state.fieldErrors.slug} field="slug" />
          </div>
          <div className="lg:col-span-2">
            <label className="text-sm font-semibold text-[#111827]" htmlFor="merchant-website-url">Website URL</label>
            <input aria-describedby={describedBy("websiteUrl", "merchant-website-url-hint")} aria-invalid={Boolean(state.fieldErrors.websiteUrl)} className={inputClass} defaultValue={merchant?.websiteUrl ?? ""} disabled={isPending} id="merchant-website-url" maxLength={2048} name="websiteUrl" placeholder="https://www.example.com" required type="url" />
            <p className="mt-2 text-xs leading-5 text-[#6B7280]" id="merchant-website-url-hint">Official HTTP or HTTPS merchant website.</p>
            <FieldError error={state.fieldErrors.websiteUrl} field="websiteUrl" />
          </div>
          <div className="lg:col-span-2">
            <label className="text-sm font-semibold text-[#111827]" htmlFor="merchant-logo-url">Logo URL <span className="font-normal text-[#6B7280]">(optional)</span></label>
            <div className="mt-2 grid gap-4 sm:grid-cols-[6rem_minmax(0,1fr)] sm:items-start">
              <MerchantLogoPreview large logoUrl={logoUrl || null} name={name || "Merchant"} />
              <div><input aria-describedby={describedBy("logoUrl", "merchant-logo-url-hint")} aria-invalid={Boolean(state.fieldErrors.logoUrl)} className="min-h-12 w-full rounded-[10px] border border-[#D1D5DB] bg-white px-4 text-sm text-[#111827] outline-none transition-colors placeholder:text-[#6B7280] hover:border-[#9CA3AF] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[#F3F4F6] motion-reduce:transition-none" disabled={isPending} id="merchant-logo-url" maxLength={2048} name="logoUrl" onChange={(event) => setLogoUrl(event.target.value)} placeholder="https://example.com/logo.png" type="url" value={logoUrl} /><p className="mt-2 text-xs leading-5 text-[#6B7280]" id="merchant-logo-url-hint">Temporary URL; the preview falls back safely if unavailable.</p><FieldError error={state.fieldErrors.logoUrl} field="logoUrl" /></div>
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-[#111827]" htmlFor="merchant-affiliate-network">Affiliate network</label>
            <select aria-describedby={describedBy("affiliateNetwork")} aria-invalid={Boolean(state.fieldErrors.affiliateNetwork)} className={inputClass} defaultValue={merchant?.affiliateNetwork ?? "Other"} disabled={isPending} id="merchant-affiliate-network" name="affiliateNetwork" required>{affiliateNetworks.map((network) => <option key={network} value={network}>{network}</option>)}</select>
            <FieldError error={state.fieldErrors.affiliateNetwork} field="affiliateNetwork" />
          </div>
          <div>
            <label className="text-sm font-semibold text-[#111827]" htmlFor="merchant-tracking-parameter">Affiliate tracking parameter <span className="font-normal text-[#6B7280]">(optional)</span></label>
            <input aria-describedby={describedBy("affiliateTrackingParameter", "merchant-tracking-hint")} aria-invalid={Boolean(state.fieldErrors.affiliateTrackingParameter)} className={inputClass} defaultValue={merchant?.affiliateTrackingParameter ?? ""} disabled={isPending} id="merchant-tracking-parameter" maxLength={100} name="affiliateTrackingParameter" placeholder="tag" />
            <p className="mt-2 text-xs leading-5 text-[#6B7280]" id="merchant-tracking-hint">Parameter key only, without ? or =.</p>
            <FieldError error={state.fieldErrors.affiliateTrackingParameter} field="affiliateTrackingParameter" />
          </div>
        </div>
      </fieldset>

      <fieldset className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_2px_rgba(17,24,39,0.04)] sm:p-6">
        <legend className="px-1 text-lg font-bold text-[#111827]">Status</legend>
        <label className="mt-2 flex min-h-12 cursor-pointer items-start gap-3 rounded-[10px] border border-[#E5E7EB] p-4 hover:bg-[#F8FAFC] focus-within:ring-2 focus-within:ring-[#2563EB] focus-within:ring-offset-2"><input className="mt-0.5 h-5 w-5 rounded border-[#9CA3AF] accent-[#2563EB]" defaultChecked={merchant?.isActive ?? true} disabled={isPending} name="isActive" type="checkbox" /><span><span className="block text-sm font-semibold text-[#111827]">Active merchant</span><span className="mt-1 block text-xs leading-5 text-[#6B7280]">Active merchants can be selected for eligible offers.</span></span></label>
      </fieldset>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Link className="inline-flex min-h-12 items-center justify-center rounded-[10px] border border-[#D1D5DB] bg-white px-5 text-sm font-semibold text-[#111827] hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2" href="/admin/merchants">Cancel</Link><button className="inline-flex min-h-12 items-center justify-center rounded-[10px] bg-[#2563EB] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#1D4ED8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[#93C5FD] motion-reduce:transition-none" disabled={isPending} type="submit">{isPending ? "Saving..." : mode === "create" ? "Create Merchant" : "Save Changes"}</button></div>
    </form>
  );
}
