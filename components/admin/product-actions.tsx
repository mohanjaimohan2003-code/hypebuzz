"use client";

import Link from "next/link";
import { useActionState, type FormEvent } from "react";
import { archiveProduct } from "@/app/admin/(protected)/products/actions";
import { initialProductActionState } from "@/lib/validation/product";
import type { ProductStatus } from "@/lib/types/database";
import { AdminIcon } from "./admin-icon";

export function ProductActions({
  productId,
  productName,
  status,
}: {
  productId: string;
  productName: string;
  status: ProductStatus;
}) {
  const archiveAction = archiveProduct.bind(null, productId);
  const [state, formAction, isPending] = useActionState(
    archiveAction,
    initialProductActionState,
  );

  function confirmArchive(event: FormEvent<HTMLFormElement>) {
    if (!window.confirm(`Archive ${productName}? It will no longer be published.`)) {
      event.preventDefault();
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <Link
          aria-label={`Edit ${productName}`}
          className="inline-flex min-h-11 items-center gap-2 rounded-[10px] border border-[#D1D5DB] bg-white px-3 py-2 text-sm font-semibold text-[#111827] transition-colors hover:border-[#2563EB] hover:bg-[#EFF6FF] hover:text-[#1D4ED8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 motion-reduce:transition-none"
          href={`/admin/products/${productId}/edit`}
        >
          <AdminIcon className="h-4 w-4" name="edit" />
          Edit
        </Link>
        {status !== "archived" ? (
          <form action={formAction} onSubmit={confirmArchive}>
            <button
              aria-label={`Archive ${productName}`}
              className="inline-flex min-h-11 items-center gap-2 rounded-[10px] border border-[#FCA5A5] bg-white px-3 py-2 text-sm font-semibold text-[#B91C1C] transition-colors hover:bg-[#FEF2F2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[#F3F4F6] disabled:text-[#6B7280] motion-reduce:transition-none"
              disabled={isPending}
              type="submit"
            >
              <AdminIcon className="h-4 w-4" name="archive" />
              {isPending ? "Archiving…" : "Archive"}
            </button>
          </form>
        ) : null}
      </div>
      {state.status === "error" ? (
        <p aria-live="polite" className="mt-2 max-w-xs text-xs font-medium text-[#B91C1C]" role="alert">
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
