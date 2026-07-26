import {
  offerAvailabilityValues,
  publicationErrorMessages,
  validateOfferContract,
} from "@/lib/offers/publication-contract";

export const offerStockStatuses = offerAvailabilityValues;

export type OfferStockStatus = (typeof offerStockStatuses)[number];

export type OfferFormValues = {
  productId: string;
  merchantId: string;
  affiliateUrl: string;
  currentPrice: number;
  originalPrice: number | null;
  currency: string;
  stockStatus: OfferStockStatus;
  isActive: boolean;
  notes: string;
  shippingNote: string;
  offerTitle: string;
  lastCheckedAt: string;
};

export type OfferField =
  | "productId"
  | "merchantId"
  | "affiliateUrl"
  | "currentPrice"
  | "originalPrice"
  | "currency"
  | "stockStatus"
  | "notes"
  | "shippingNote"
  | "offerTitle"
  | "lastCheckedAt";

export type OfferFieldErrors = Partial<Record<OfferField, string>>;

export type OfferActionState = {
  status: "idle" | "error";
  message: string;
  fieldErrors: OfferFieldErrors;
};

export const initialOfferActionState: OfferActionState = {
  status: "idle",
  message: "",
  fieldErrors: {},
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const moneyPattern = /^\d{1,10}(?:\.\d{1,2})?$/;

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function parseMoney(value: string) {
  return moneyPattern.test(value) ? Number(value) : null;
}

export function isOfferUuid(value: string) {
  return uuidPattern.test(value);
}

export function isOfferStockStatus(value: string): value is OfferStockStatus {
  return offerStockStatuses.includes(value as OfferStockStatus);
}

export function calculateDiscountPercent(currentPrice: number, originalPrice: number | null) {
  if (!originalPrice || originalPrice <= 0) return null;
  return Math.max(0, Math.round(((originalPrice - currentPrice) / originalPrice) * 100));
}

export function validateOfferForm(formData: FormData):
  | { success: true; data: OfferFormValues }
  | { success: false; state: OfferActionState } {
  const currentPriceInput = getString(formData, "currentPrice");
  const originalPriceInput = getString(formData, "originalPrice");
  const currentPrice = parseMoney(currentPriceInput);
  const originalPrice = originalPriceInput ? parseMoney(originalPriceInput) : null;
  const stockStatusInput = getString(formData, "stockStatus");
  const values: OfferFormValues = {
    productId: getString(formData, "productId"),
    merchantId: getString(formData, "merchantId"),
    affiliateUrl: getString(formData, "affiliateUrl"),
    currentPrice: currentPrice ?? 0,
    originalPrice,
    currency: getString(formData, "currency").toUpperCase(),
    stockStatus: stockStatusInput as OfferStockStatus,
    isActive: formData.get("isActive") === "on",
    notes: getString(formData, "notes"),
    shippingNote: getString(formData, "shippingNote"),
    offerTitle: getString(formData, "offerTitle"),
    lastCheckedAt: getString(formData, "lastCheckedAt"),
  };
  const fieldErrors: OfferFieldErrors = {};

  if (!isOfferUuid(values.productId)) fieldErrors.productId = "Select a valid product.";
  if (!isOfferUuid(values.merchantId)) fieldErrors.merchantId = "Select a valid merchant.";

  const contractErrors = validateOfferContract({
    affiliateUrl: values.affiliateUrl,
    currentPrice,
    originalPrice: originalPriceInput && originalPrice === null ? Number.NaN : originalPrice,
    currency: values.currency,
    availability: stockStatusInput,
    isActive: false,
    merchantIsActive: true,
  });
  if (contractErrors.includes("OFFER_URL_INVALID")) fieldErrors.affiliateUrl = publicationErrorMessages.OFFER_URL_INVALID;
  if (contractErrors.includes("OFFER_CURRENT_PRICE_INVALID")) fieldErrors.currentPrice = publicationErrorMessages.OFFER_CURRENT_PRICE_INVALID;
  if (contractErrors.includes("OFFER_ORIGINAL_PRICE_INVALID")) fieldErrors.originalPrice = publicationErrorMessages.OFFER_ORIGINAL_PRICE_INVALID;
  if (contractErrors.includes("OFFER_CURRENCY_INVALID")) fieldErrors.currency = publicationErrorMessages.OFFER_CURRENCY_INVALID;
  if (contractErrors.includes("OFFER_AVAILABILITY_INVALID")) fieldErrors.stockStatus = publicationErrorMessages.OFFER_AVAILABILITY_INVALID;

  if (values.notes.length > 500) fieldErrors.notes = "Keep notes within 500 characters.";
  if (values.notes.length > 100) fieldErrors.notes = "Keep the coupon code within 100 characters.";
  if (values.shippingNote.length > 300) fieldErrors.shippingNote = "Keep the shipping note within 300 characters.";
  if (values.offerTitle.length > 160) fieldErrors.offerTitle = "Keep the offer title within 160 characters.";
  if (values.lastCheckedAt && Number.isNaN(new Date(values.lastCheckedAt).getTime())) {
    fieldErrors.lastCheckedAt = "Enter a valid last checked date.";
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
