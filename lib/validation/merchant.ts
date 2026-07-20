export const affiliateNetworks = [
  "Amazon Associates",
  "Flipkart Affiliate",
  "Admitad",
  "Impact",
  "CJ",
  "Other",
] as const;

export type AffiliateNetwork = (typeof affiliateNetworks)[number];

export type MerchantFormValues = {
  name: string;
  slug: string;
  websiteUrl: string;
  logoUrl: string;
  affiliateNetwork: AffiliateNetwork;
  affiliateTrackingParameter: string;
  isActive: boolean;
};

export type MerchantField =
  | "name"
  | "slug"
  | "websiteUrl"
  | "logoUrl"
  | "affiliateNetwork"
  | "affiliateTrackingParameter";

export type MerchantFieldErrors = Partial<Record<MerchantField, string>>;

export type MerchantActionState = {
  status: "idle" | "error";
  message: string;
  fieldErrors: MerchantFieldErrors;
};

export const initialMerchantActionState: MerchantActionState = {
  status: "idle",
  message: "",
  fieldErrors: {},
};

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const trackingParameterPattern = /^[A-Za-z0-9_.\-\[\]]+$/;

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function createMerchantSlug(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160)
    .replace(/-+$/g, "");
}

export function isMerchantUuid(value: string) {
  return uuidPattern.test(value);
}

export function isAffiliateNetwork(value: string): value is AffiliateNetwork {
  return affiliateNetworks.includes(value as AffiliateNetwork);
}

export function validateMerchantForm(formData: FormData):
  | { success: true; data: MerchantFormValues }
  | { success: false; state: MerchantActionState } {
  const network = getString(formData, "affiliateNetwork");
  const values: MerchantFormValues = {
    name: getString(formData, "name"),
    slug: getString(formData, "slug").toLowerCase(),
    websiteUrl: getString(formData, "websiteUrl"),
    logoUrl: getString(formData, "logoUrl"),
    affiliateNetwork: network as AffiliateNetwork,
    affiliateTrackingParameter: getString(
      formData,
      "affiliateTrackingParameter",
    ),
    isActive: formData.get("isActive") === "on",
  };
  const fieldErrors: MerchantFieldErrors = {};

  if (values.name.length < 2 || values.name.length > 120) {
    fieldErrors.name = "Enter a merchant name between 2 and 120 characters.";
  }

  if (!slugPattern.test(values.slug) || values.slug.length > 160) {
    fieldErrors.slug = "Use lowercase letters, numbers, and single hyphens only.";
  }

  if (!values.websiteUrl || values.websiteUrl.length > 2048 || !isHttpUrl(values.websiteUrl)) {
    fieldErrors.websiteUrl = "Enter a complete HTTP or HTTPS website URL.";
  }

  if (values.logoUrl.length > 2048 || (values.logoUrl && !isHttpUrl(values.logoUrl))) {
    fieldErrors.logoUrl = "Enter a complete HTTP or HTTPS logo URL.";
  }

  if (!isAffiliateNetwork(network)) {
    fieldErrors.affiliateNetwork = "Select a valid affiliate network.";
  }

  if (
    values.affiliateTrackingParameter.length > 100 ||
    (values.affiliateTrackingParameter &&
      !trackingParameterPattern.test(values.affiliateTrackingParameter))
  ) {
    fieldErrors.affiliateTrackingParameter =
      "Use up to 100 letters, numbers, dots, underscores, hyphens, or brackets.";
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
