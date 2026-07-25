import type { ProductStatus } from "@/lib/types/database";

export type EditableProductStatus = Exclude<ProductStatus, "archived">;

export type ProductFormValues = {
  name: string;
  slug: string;
  shortDescription: string;
  categoryId: string;
  imageUrl: string;
  imageManifest: ProductImageManifestItem[];
  isFeatured: boolean;
  isTrending: boolean;
  status: EditableProductStatus;
  merchantId: string;
  affiliateUrl: string;
  currentPrice: number | null;
  originalPrice: number | null;
  currency: string;
  stockStatus: "in_stock" | "limited_stock" | "out_of_stock";
  offerIsActive: boolean;
};
export type ProductImageManifestItem = { kind: "existing" | "external" | "upload"; id?: string; url?: string; fileIndex?: number; isPrimary: boolean };

export type ProductField =
  | "name"
  | "slug"
  | "shortDescription"
  | "categoryId"
  | "imageUrl"
  | "status"
  | "merchantId"
  | "affiliateUrl"
  | "currentPrice"
  | "originalPrice"
  | "currency"
  | "stockStatus"
  | "offerIsActive";

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
const moneyPattern = /^\d{1,10}(?:\.\d{1,2})?$/;

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
  const currentPriceInput = getString(formData, "currentPrice");
  const originalPriceInput = getString(formData, "originalPrice");
  const currentPrice = moneyPattern.test(currentPriceInput) ? Number(currentPriceInput) : null;
  const originalPrice = moneyPattern.test(originalPriceInput) ? Number(originalPriceInput) : null;
  const stockStatus = getString(formData, "stockStatus") as ProductFormValues["stockStatus"];
  let imageManifest: ProductImageManifestItem[] = [];
  try { const parsed = JSON.parse(getString(formData, "imageManifest") || "[]") as unknown; if (!Array.isArray(parsed)) throw new Error(); imageManifest = parsed as ProductImageManifestItem[]; } catch { imageManifest = []; }
  const values: ProductFormValues = {
    name: getString(formData, "name"),
    slug: getString(formData, "slug").toLowerCase(),
    shortDescription: getString(formData, "shortDescription"),
    categoryId: getString(formData, "categoryId"),
    imageUrl: "",
    imageManifest,
    isFeatured: formData.get("isFeatured") === "on",
    isTrending: formData.get("isTrending") === "on",
    status: getString(formData, "status") as EditableProductStatus,
    merchantId: getString(formData, "merchantId"),
    affiliateUrl: getString(formData, "affiliateUrl"),
    currentPrice,
    originalPrice,
    currency: getString(formData, "currency").toUpperCase(),
    stockStatus,
    offerIsActive: formData.get("offerIsActive") === "on",
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

  const files = formData.getAll("uploadedImages").filter((value): value is File => value instanceof File && value.size > 0);
  if (imageManifest.length > 8) fieldErrors.imageUrl = "You can upload up to 8 product images.";
  else if (imageManifest.filter(x => x.isPrimary).length > 1) fieldErrors.imageUrl = "Choose only one primary image.";
  else for (const image of imageManifest) {
    if (image.kind === "existing" && (!image.id || !isUuid(image.id))) { fieldErrors.imageUrl = "An existing image selection is invalid."; break; }
    if (image.kind === "external") { try { const parsed = new URL(image.url ?? ""); if (!["http:","https:"].includes(parsed.protocol) || (image.url?.length ?? 0) > 2048) throw new Error(); } catch { fieldErrors.imageUrl = "Enter complete HTTP or HTTPS image URLs."; break; } }
    if (image.kind === "upload" && (!Number.isInteger(image.fileIndex) || (image.fileIndex ?? -1) < 0 || !files[image.fileIndex!])) { fieldErrors.imageUrl = "A selected upload is missing. Choose it again."; break; }
  }
  if (!fieldErrors.imageUrl && files.some(file => !["image/jpeg","image/png","image/webp"].includes(file.type))) fieldErrors.imageUrl = "Only JPG, PNG, or WebP images are allowed.";
  if (!fieldErrors.imageUrl && files.some(file => file.size > 5*1024*1024)) fieldErrors.imageUrl = "Each image must be smaller than 5 MB.";

  if (values.status !== "draft" && values.status !== "published") {
    fieldErrors.status = "Select Draft or Published.";
  }

  const hasOfferInput = Boolean(values.merchantId || values.affiliateUrl || currentPriceInput || originalPriceInput);
  if (values.status === "published" || hasOfferInput) {
    if (!isUuid(values.merchantId)) fieldErrors.merchantId = "Select an active merchant.";
    try {
      const url = new URL(values.affiliateUrl);
      if (!['http:', 'https:'].includes(url.protocol) || values.affiliateUrl.length > 2048) throw new Error();
    } catch {
      fieldErrors.affiliateUrl = "Enter a complete HTTP or HTTPS affiliate URL.";
    }
    if (currentPrice === null || currentPrice <= 0) fieldErrors.currentPrice = "Enter a current price greater than zero.";
    if (originalPrice === null || originalPrice <= 0) fieldErrors.originalPrice = "Enter an original price greater than zero.";
    else if (currentPrice !== null && originalPrice < currentPrice) fieldErrors.originalPrice = "Original price cannot be lower than current price.";
    if (!/^[A-Z]{3}$/.test(values.currency)) fieldErrors.currency = "Use a three-letter currency code such as INR.";
    if (!["in_stock", "limited_stock", "out_of_stock"].includes(stockStatus)) fieldErrors.stockStatus = "Select a valid stock status.";
  }
  if (values.status === "published" && !values.offerIsActive) {
    fieldErrors.offerIsActive = "A published product requires an active offer.";
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
