"use client";

import Link from "next/link";
import { useActionState, useState, type FormEvent } from "react";
import { archiveProduct, permanentlyDeleteProduct } from "@/app/admin/(protected)/products/actions";
import { initialProductActionState } from "@/lib/validation/product";
import type { ProductStatus } from "@/lib/types/database";
import { AdminIcon } from "./admin-icon";

export function ProductActions({ productId, productName, status }: { productId: string; productName: string; status: ProductStatus }) {
  const [archiveState, archiveAction, isArchiving] = useActionState(archiveProduct.bind(null, productId), initialProductActionState);
  const [deleteState, deleteAction, isDeleting] = useActionState(permanentlyDeleteProduct.bind(null, productId), initialProductActionState);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");

  function confirmArchive(event: FormEvent<HTMLFormElement>) {
    if (!window.confirm(`Archive ${productName}? It will no longer be published.`)) event.preventDefault();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <Link aria-label={`Edit ${productName}`} className="inline-flex min-h-11 items-center gap-2 rounded-[10px] border border-[#D1D5DB] bg-white px-3 py-2 text-sm font-semibold text-[#111827] transition-colors hover:border-[#2563EB] hover:bg-[#EFF6FF] hover:text-[#1D4ED8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2" href={`/admin/products/${productId}/edit`}>
          <AdminIcon className="h-4 w-4" name="edit" /> Edit
        </Link>
        {status !== "archived" ? (
          <form action={archiveAction} onSubmit={confirmArchive}>
            <button aria-label={`Archive ${productName}`} className="inline-flex min-h-11 items-center gap-2 rounded-[10px] border border-[#FCA5A5] bg-white px-3 py-2 text-sm font-semibold text-[#B91C1C] hover:bg-[#FEF2F2] disabled:cursor-not-allowed disabled:bg-[#F3F4F6] disabled:text-[#6B7280]" disabled={isArchiving} type="submit">
              <AdminIcon className="h-4 w-4" name="archive" /> {isArchiving ? "Archiving…" : "Archive"}
            </button>
          </form>
        ) : (
          <button className="inline-flex min-h-11 items-center rounded-[10px] bg-[#DC2626] px-3 py-2 text-sm font-semibold text-white hover:bg-[#B91C1C]" onClick={() => { setConfirmation(""); setDeleteDialogOpen(true); }} type="button">Delete permanently</button>
        )}
      </div>
      {archiveState.status === "error" ? <p aria-live="polite" className="mt-2 max-w-xs text-xs font-medium text-[#B91C1C]" role="alert">{archiveState.message}</p> : null}
      {deleteDialogOpen ? (
        <div aria-labelledby={`delete-product-title-${productId}`} aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-[#111827]" id={`delete-product-title-${productId}`}>Delete product permanently?</h2>
            <p className="mt-3 text-sm leading-6 text-[#4B5563]">This will permanently delete the product, its offers, and its uploaded images. This action cannot be undone.</p>
            <form action={deleteAction} className="mt-5">
              <label className="text-sm font-semibold text-[#111827]" htmlFor={`delete-confirmation-${productId}`}>Type DELETE to confirm</label>
              <input autoComplete="off" className="mt-2 min-h-11 w-full rounded-[10px] border border-[#D1D5DB] px-3 text-sm outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]" disabled={isDeleting} id={`delete-confirmation-${productId}`} name="confirmation" onChange={(event) => setConfirmation(event.target.value)} value={confirmation} />
              {deleteState.status === "error" ? <p aria-live="polite" className="mt-3 text-sm font-medium text-[#B91C1C]" role="alert">{deleteState.message}</p> : null}
              <div className="mt-6 flex justify-end gap-3">
                <button className="min-h-11 rounded-[10px] border border-[#D1D5DB] bg-white px-4 text-sm font-semibold" disabled={isDeleting} onClick={() => setDeleteDialogOpen(false)} type="button">Cancel</button>
                <button className="min-h-11 rounded-[10px] bg-[#DC2626] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#FCA5A5]" disabled={isDeleting || confirmation !== "DELETE"} type="submit">{isDeleting ? "Deleting permanently…" : "Delete permanently"}</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
