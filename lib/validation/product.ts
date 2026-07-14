import type { ProductStatus } from "@/lib/types/database";

export type EditableProductStatus = Exclude<ProductStatus, "archived">;

export type ProductFormValues = {
  name: string;
  slug: string;
  shortDescription: string;
  categoryId: string;
  imageUrl: string;
  isFeatured: boolean;
  isTrending: boolean;
  status: EditableProductStatus;
};

export type ProductField =
  | "name"
  | "slug"
  | "shortDescription"
  | "categoryId"
  | "imageUrl"
  | "status";

export type ProductFieldErrors = Partial<Record<ProductField, string>>;

export type ProductActionState = {
  status: "idle" | "error";
  message: string;
  fieldErrors: ProductFieldErrors;
};

export const initialProductActionState: ProductActionState = {
  status: "idle",
  message: "",
  fieldErrors: {},
};

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export function createProductSlug(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160)
    .replace(/-+$/g, "");
}

export function isUuid(value: string) {
  return uuidPattern.test(value);
}

export function validateProductForm(formData: FormData):
  | { success: true; data: ProductFormValues }
  | { success: false; state: ProductActionState } {
  const values: ProductFormValues = {
    name: getString(formData, "name"),
    slug: getString(formData, "slug").toLowerCase(),
    shortDescription: getString(formData, "shortDescription"),
    categoryId: getString(formData, "categoryId"),
    imageUrl: getString(formData, "imageUrl"),
    isFeatured: formData.get("isFeatured") === "on",
    isTrending: formData.get("isTrending") === "on",
    status: getString(formData, "status") as EditableProductStatus,
  };
  const fieldErrors: ProductFieldErrors = {};

  if (values.name.length < 2 || values.name.length > 160) {
    fieldErrors.name = "Enter a product name between 2 and 160 characters.";
  }

  if (!slugPattern.test(values.slug) || values.slug.length > 160) {
    fieldErrors.slug = "Use lowercase letters, numbers, and single hyphens only.";
  }

  if (values.shortDescription.length > 300) {
    fieldErrors.shortDescription = "Keep the short description within 300 characters.";
  }

  if (!isUuid(values.categoryId)) {
    fieldErrors.categoryId = "Select a valid category.";
  }

  if (values.imageUrl.length > 2048) {
    fieldErrors.imageUrl = "Keep the image URL within 2,048 characters.";
  } else if (values.imageUrl) {
    try {
      const url = new URL(values.imageUrl);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        fieldErrors.imageUrl = "Use an HTTP or HTTPS image URL.";
      }
    } catch {
      fieldErrors.imageUrl = "Enter a complete HTTP or HTTPS image URL.";
    }
  }

  if (values.status !== "draft" && values.status !== "published") {
    fieldErrors.status = "Select Draft or Published.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      success: false,
      state: {
        status: "error",
        message: "Review the highlighted fields and try again.",
        fieldErrors,
      },
    };
  }

  return { success: true, data: values };
}
