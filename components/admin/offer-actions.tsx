"use client";

import Link from "next/link";
import { useActionState, type FormEvent } from "react";
import { disableOffer } from "@/app/admin/(protected)/offers/actions";
import { initialOfferActionState } from "@/lib/validation/offer";
import { AdminIcon } from "./admin-icon";

export function OfferActions({
  offerId,
  productName,
  merchantName,
  isActive,
}: {
  offerId: string;
  productName: string;
  merchantName: string;
  isActive: boolean;
}) {
  const action = disableOffer.bind(null, offerId);
  const [state, formAction, isPending] = useActionState(action, initialOfferActionState);

  function confirmDisable(event: FormEvent<HTMLFormElement>) {
    if (!window.confirm(`Disable the ${merchantName} offer for ${productName}?`)) {
      event.preventDefault();
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <Link aria-label={`Edit ${merchantName} offer for ${productName}`} className="inline-flex min-h-11 items-center gap-2 rounded-[10px] border border-[#D1D5DB] bg-white px-3 py-2 text-sm font-semibold text-[#111827] transition-colors hover:border-[#2563EB] hover:bg-[#EFF6FF] hover:text-[#1D4ED8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 motion-reduce:transition-none" href={`/admin/offers/${offerId}/edit`}>
          <AdminIcon className="h-4 w-4" name="edit" /> Edit
        </Link>
        {isActive ? (
          <form action={formAction} onSubmit={confirmDisable}>
            <button aria-label={`Disable ${merchantName} offer for ${productName}`} className="inline-flex min-h-11 items-center gap-2 rounded-[10px] border border-[#FCA5A5] bg-white px-3 py-2 text-sm font-semibold text-[#B91C1C] transition-colors hover:bg-[#FEF2F2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[#F3F4F6] disabled:text-[#6B7280] motion-reduce:transition-none" disabled={isPending} type="submit">
              <AdminIcon className="h-4 w-4" name="archive" />
              {isPending ? "Disabling..." : "Disable"}
            </button>
          </form>
        ) : null}
      </div>
      {state.status === "error" ? <p aria-live="polite" className="mt-2 max-w-xs text-xs font-medium text-[#B91C1C]" role="alert">{state.message}</p> : null}
    </div>
  );
}
