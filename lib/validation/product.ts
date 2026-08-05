import type { ProductStatus } from "@/lib/types/database";
import { isOfferUuid, type OfferStockStatus } from "@/lib/validation/offer";
import {
  isOfferEligibleForPublication,
  publicationErrorMessages,
  validateOfferContract,
} from "@/lib/offers/publication-contract";
import { parseProductRichFields, type ProductRichFields } from "@/lib/products/rich-fields";

export type EditableProductStatus = Exclude<ProductStatus, "archived">;

export type ProductFormValues = ProductRichFields & {
  name: string;
  slug: string;
  shortDescription: string;
  categoryId: string;
  brandId: string;
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
  stockStatus: OfferStockStatus;
  offerIsActive: boolean;
  offers: ProductOfferManifestItem[];
};
export type ProductOfferManifestItem = { id: string; persisted?: boolean; merchantId: string; affiliateUrl: string; currentPrice: number | null; originalPrice: number | null; currency: string; stockStatus: OfferStockStatus; isActive: boolean; couponCode: string; shippingNote: string; offerTitle: string; lastCheckedAt: string };
export type ProductImageManifestItem = { kind: "existing" | "external" | "upload"; id?: string; url?: string; fileIndex?: number; isPrimary: boolean };

export type ProductField =
  | "name"
  | "slug"
  | "shortDescription"
  | "longDescription"
  | "highlights"
  | "specifications"
  | "seoTitle"
  | "seoDescription"
  | "categoryId"
  | "brandId"
  | "imageUrl"
  | "status"
  | "merchantId"
  | "affiliateUrl"
  | "currentPrice"
  | "originalPrice"
  | "currency"
  | "stockStatus"
  | "offerIsActive"
  | "offerList";

export type ProductFieldErrors = Partial<Record<ProductField, string>>;

export type ProductActionState = {
  status: "idle" | "error";
  message: string;
  fieldErrors: ProductFieldErrors;
  validationErrors?: Array<{ field: ProductField; message: string }>;
  validationMode?: "draft" | "publish";
  existingProductId?: string;
  match?: { id: string; name: string; slug: string; imageUrl: string | null; brand: string | null; category: string | null; confidence: number; reasons: string[]; merchantName: string | null; merchantExists: boolean; needsUpdateConfirmation: boolean };
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
  let offers: ProductOfferManifestItem[] = [];
  try { const parsed = JSON.parse(getString(formData, "offerManifest") || "[]") as unknown; if (!Array.isArray(parsed)) throw new Error(); offers = parsed as ProductOfferManifestItem[]; } catch { offers = []; }
  const richFields = parseProductRichFields(formData);
  const values: ProductFormValues = {
    name: getString(formData, "name"),
    slug: getString(formData, "slug").toLowerCase(),
    shortDescription: getString(formData, "shortDescription"),
    categoryId: getString(formData, "categoryId"),
    brandId: getString(formData, "brandId"),
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
    offers,
    ...richFields.values,
  };
  const fieldErrors: ProductFieldErrors = { ...richFields.errors };

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
    fieldErrors.categoryId = "Please select a category.";
  }

  if (values.brandId && !isUuid(values.brandId)) {
    fieldErrors.brandId = "Select a valid brand.";
  }

  const files = formData.getAll("uploadedImages").filter((value): value is File => value instanceof File && value.size > 0);
  if (imageManifest.length === 0) fieldErrors.imageUrl = "Upload at least one product image before saving.";
  else if (imageManifest.length > 8) fieldErrors.imageUrl = "You can upload up to 8 product images.";
  else if (imageManifest.some((image) => !image || typeof image !== "object" || !["existing", "external", "upload"].includes(image.kind))) fieldErrors.imageUrl = "The product image list is invalid.";
  else if (imageManifest.length > 0 && imageManifest.filter((image) => image.isPrimary === true).length !== 1) fieldErrors.imageUrl = "Choose exactly one primary image.";
  else for (const image of imageManifest) {
    if (typeof image.isPrimary !== "boolean") { fieldErrors.imageUrl = "The product image list is invalid."; break; }
    if (image.kind === "existing" && (!image.id || !isUuid(image.id))) { fieldErrors.imageUrl = "An existing image selection is invalid."; break; }
    if (image.kind === "external") { try { const parsed = new URL(image.url ?? ""); if (!["http:","https:"].includes(parsed.protocol) || (image.url?.length ?? 0) > 2048) throw new Error(); } catch { fieldErrors.imageUrl = "Enter complete HTTP or HTTPS image URLs."; break; } }
    if (image.kind === "upload" && (!Number.isInteger(image.fileIndex) || (image.fileIndex ?? -1) < 0 || !files[image.fileIndex!])) { fieldErrors.imageUrl = "A selected upload is missing. Choose it again."; break; }
  }
  if (!fieldErrors.imageUrl && files.some(file => !["image/jpeg","image/png","image/webp"].includes(file.type))) fieldErrors.imageUrl = "Only JPG, PNG, or WebP images are allowed.";
  if (!fieldErrors.imageUrl && files.some(file => file.size > 5*1024*1024)) fieldErrors.imageUrl = "Each image must be smaller than 5 MB.";

  if (values.status !== "draft" && values.status !== "published") {
    fieldErrors.status = "Select Draft or Published.";
  }

  const usedMerchants = new Set<string>();
  for (const [index, offer] of offers.entries()) {
    const label = `Offer ${index + 1}`;
    if (!offer || !isOfferUuid(offer.id) || !isOfferUuid(offer.merchantId)) { fieldErrors.merchantId = `${label}: select a valid merchant.`; fieldErrors.offerList = fieldErrors.merchantId; break; }
    const contractErrors = validateOfferContract({
      affiliateUrl: offer.affiliateUrl,
      currentPrice: offer.currentPrice,
      originalPrice: offer.originalPrice,
      currency: offer.currency,
      availability: offer.stockStatus,
      isActive: false,
      merchantIsActive: true,
    });
    if (contractErrors.length) {
      const target: Partial<Record<(typeof contractErrors)[number], ProductField>> = {
        OFFER_URL_INVALID: "affiliateUrl", OFFER_CURRENT_PRICE_INVALID: "currentPrice",
        OFFER_ORIGINAL_PRICE_INVALID: "originalPrice", OFFER_CURRENCY_INVALID: "currency",
        OFFER_AVAILABILITY_INVALID: "stockStatus", OFFER_MERCHANT_INACTIVE: "merchantId",
      };
      for (const contractError of contractErrors) {
        const reason = `${label}: ${publicationErrorMessages[contractError]}`;
        fieldErrors[target[contractError] ?? "offerList"] = reason;
      }
      fieldErrors.offerList = `${label}: ${publicationErrorMessages[contractErrors[0]]}`;
      break;
    }
    if (offer.couponCode.length > 100 || offer.shippingNote.length > 300 || offer.offerTitle.length > 160) { fieldErrors.offerList = `${label}: optional offer details are too long.`; break; }
    if (offer.lastCheckedAt && Number.isNaN(new Date(offer.lastCheckedAt).getTime())) { fieldErrors.offerList = `${label}: enter a valid last checked date.`; break; }
    if (usedMerchants.has(offer.merchantId)) { fieldErrors.offerList = "This project supports only one offer per product and merchant."; break; }
    usedMerchants.add(offer.merchantId);
  }
  if (values.status === "published" && !offers.some((offer) => isOfferEligibleForPublication({
    affiliateUrl: offer.affiliateUrl,
    currentPrice: offer.currentPrice,
    originalPrice: offer.originalPrice,
    currency: offer.currency,
    availability: offer.stockStatus,
    isActive: offer.isActive,
    // The Server Action re-reads merchant activity before saving.
    merchantIsActive: true,
  }))) fieldErrors.offerList = publicationErrorMessages.PRODUCT_OFFER_REQUIRED;

  if (Object.keys(fieldErrors).length > 0) {
    const validationMode = values.status === "published" ? "publish" : "draft";
    const validationErrors = (Object.entries(fieldErrors) as Array<[ProductField, string]>).map(([field, message]) => ({ field, message }));
    if (process.env.NODE_ENV === "development") console.error("Product validation failed", { validationMode, validationErrors, fieldErrors });
    return {
      success: false,
      state: {
        status: "error",
        message: values.status === "published" ? "Product cannot be published:" : "Draft cannot be saved:",
        fieldErrors,
        validationErrors,
        validationMode,
      },
    };
  }

  return { success: true, data: values };
}
