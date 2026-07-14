"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  createCategory,
  updateCategory,
} from "@/app/admin/(protected)/categories/actions";
import {
  createCategorySlug,
  initialCategoryActionState,
  type CategoryField,
} from "@/lib/validation/category";

export type CategoryFormInitialCategory = {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  isActive: boolean;
};

type CategoryFormProps = {
  mode: "create" | "edit";
  category?: CategoryFormInitialCategory;
};

const inputClass = "mt-2 min-h-12 w-full rounded-[10px] border border-[#D1D5DB] bg-white px-4 text-sm text-[#111827] outline-none transition-colors placeholder:text-[#6B7280] hover:border-[#9CA3AF] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[#F3F4F6] motion-reduce:transition-none";

function FieldError({ field, error }: { field: CategoryField; error?: string }) {
  return error ? <p className="mt-2 text-sm font-medium text-[#B91C1C]" id={`${field}-error`}>{error}</p> : null;
}

export function CategoryForm({ mode, category }: CategoryFormProps) {
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [slugWasEdited, setSlugWasEdited] = useState(mode === "edit");
  const action = mode === "create" ? createCategory : updateCategory.bind(null, category?.id ?? "");
  const [state, formAction, isPending] = useActionState(action, initialCategoryActionState);

  function describedBy(field: CategoryField, hintId?: string) {
    const errorId = state.fieldErrors[field] ? `${field}-error` : "";
    return [hintId, errorId].filter(Boolean).join(" ") || undefined;
  }

  return (
    <form action={formAction} className="mt-8 space-y-8">
      {state.status === "error" ? (
        <div aria-live="polite" className="rounded-[10px] border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-3 text-sm font-medium text-[#991B1B]" role="alert">
          {state.message}
        </div>
      ) : null}

      <fieldset className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_2px_rgba(17,24,39,0.04)] sm:p-6">
        <legend className="px-1 text-lg font-bold text-[#111827]">Category details</legend>
        <div className="mt-2 grid gap-6 lg:grid-cols-2">
          <div>
            <label className="text-sm font-semibold text-[#111827]" htmlFor="category-name">Category name</label>
            <input
              aria-describedby={describedBy("name")}
              aria-invalid={Boolean(state.fieldErrors.name)}
              autoComplete="off"
              className={inputClass}
              disabled={isPending}
              id="category-name"
              maxLength={120}
              name="name"
              onChange={(event) => {
                const nextName = event.target.value;
                setName(nextName);
                if (!slugWasEdited) setSlug(createCategorySlug(nextName));
              }}
              required
              value={name}
            />
            <FieldError error={state.fieldErrors.name} field="name" />
          </div>

          <div>
            <label className="text-sm font-semibold text-[#111827]" htmlFor="category-slug">Slug</label>
            <input
              aria-describedby={describedBy("slug", "category-slug-hint")}
              aria-invalid={Boolean(state.fieldErrors.slug)}
              autoCapitalize="none"
              autoComplete="off"
              className={inputClass}
              disabled={isPending}
              id="category-slug"
              maxLength={160}
              name="slug"
              onChange={(event) => {
                setSlugWasEdited(true);
                setSlug(event.target.value);
              }}
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              required
              value={slug}
            />
            <p className="mt-2 text-xs leading-5 text-[#6B7280]" id="category-slug-hint">Used in category URLs. Lowercase letters, numbers, and hyphens only.</p>
            <FieldError error={state.fieldErrors.slug} field="slug" />
          </div>

          <div className="lg:col-span-2">
            <label className="text-sm font-semibold text-[#111827]" htmlFor="category-description">Description <span className="font-normal text-[#6B7280]">(optional)</span></label>
            <textarea
              aria-describedby={describedBy("description", "category-description-hint")}
              aria-invalid={Boolean(state.fieldErrors.description)}
              className={`${inputClass} min-h-32 py-3`}
              defaultValue={category?.description ?? ""}
              disabled={isPending}
              id="category-description"
              maxLength={500}
              name="description"
            />
            <p className="mt-2 text-xs leading-5 text-[#6B7280]" id="category-description-hint">Up to 500 characters.</p>
            <FieldError error={state.fieldErrors.description} field="description" />
          </div>

          <div className="lg:col-span-2">
            <label className="text-sm font-semibold text-[#111827]" htmlFor="category-image-url">Image URL <span className="font-normal text-[#6B7280]">(optional)</span></label>
            <input
              aria-describedby={describedBy("imageUrl", "category-image-url-hint")}
              aria-invalid={Boolean(state.fieldErrors.imageUrl)}
              className={inputClass}
              defaultValue={category?.imageUrl ?? ""}
              disabled={isPending}
              id="category-image-url"
              maxLength={2048}
              name="imageUrl"
              placeholder="https://example.com/category-image.jpg"
              type="url"
            />
            <p className="mt-2 text-xs leading-5 text-[#6B7280]" id="category-image-url-hint">Temporary HTTP or HTTPS image address; uploads are not part of this task.</p>
            <FieldError error={state.fieldErrors.imageUrl} field="imageUrl" />
          </div>
        </div>
      </fieldset>

      <fieldset className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_2px_rgba(17,24,39,0.04)] sm:p-6">
        <legend className="px-1 text-lg font-bold text-[#111827]">Visibility</legend>
        <label className="mt-2 flex min-h-12 cursor-pointer items-start gap-3 rounded-[10px] border border-[#E5E7EB] p-4 hover:bg-[#F8FAFC] focus-within:ring-2 focus-within:ring-[#2563EB] focus-within:ring-offset-2">
          <input className="mt-0.5 h-5 w-5 rounded border-[#9CA3AF] text-[#2563EB] focus:ring-[#2563EB]" defaultChecked={category?.isActive ?? true} disabled={isPending} name="isActive" type="checkbox" />
          <span>
            <span className="block text-sm font-semibold text-[#111827]">Active category</span>
            <span className="mt-1 block text-xs leading-5 text-[#6B7280]">Active categories may appear in public navigation and category lists.</span>
          </span>
        </label>
      </fieldset>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link className="inline-flex min-h-12 items-center justify-center rounded-[10px] border border-[#D1D5DB] bg-white px-5 text-sm font-semibold text-[#111827] hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2" href="/admin/categories">Cancel</Link>
        <button className="inline-flex min-h-12 items-center justify-center rounded-[10px] bg-[#2563EB] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#1D4ED8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[#93C5FD] motion-reduce:transition-none" disabled={isPending} type="submit">
          {isPending ? "Saving..." : mode === "create" ? "Create Category" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
