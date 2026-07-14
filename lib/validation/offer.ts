export const offerStockStatuses = [
  "in_stock",
  "limited_stock",
  "out_of_stock",
] as const;

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
};

export type OfferField =
  | "productId"
  | "merchantId"
  | "affiliateUrl"
  | "currentPrice"
  | "originalPrice"
  | "currency"
  | "stockStatus"
  | "notes";

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
const currencyPattern = /^[A-Z]{3}$/;

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
  };
  const fieldErrors: OfferFieldErrors = {};

  if (!isOfferUuid(values.productId)) fieldErrors.productId = "Select a valid product.";
  if (!isOfferUuid(values.merchantId)) fieldErrors.merchantId = "Select a valid merchant.";

  if (!values.affiliateUrl || values.affiliateUrl.length > 2048) {
    fieldErrors.affiliateUrl = "Enter an affiliate URL within 2,048 characters.";
  } else {
    try {
      const url = new URL(values.affiliateUrl);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        fieldErrors.affiliateUrl = "Use an HTTP or HTTPS affiliate URL.";
      }
    } catch {
      fieldErrors.affiliateUrl = "Enter a complete HTTP or HTTPS affiliate URL.";
    }
  }

  if (currentPrice === null || currentPrice <= 0) {
    fieldErrors.currentPrice = "Enter a current price greater than zero with up to two decimals.";
  }

  if (originalPriceInput && (originalPrice === null || originalPrice <= 0)) {
    fieldErrors.originalPrice = "Enter an original price greater than zero with up to two decimals.";
  } else if (originalPrice !== null && currentPrice !== null && originalPrice < currentPrice) {
    fieldErrors.originalPrice = "Original price cannot be lower than the current price.";
  }

  if (!currencyPattern.test(values.currency)) {
    fieldErrors.currency = "Use a three-letter currency code such as INR.";
  }

  if (!isOfferStockStatus(stockStatusInput)) {
    fieldErrors.stockStatus = "Select a valid stock status.";
  }

  if (values.notes.length > 500) fieldErrors.notes = "Keep notes within 500 characters.";

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
