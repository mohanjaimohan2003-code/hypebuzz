export type BrandFormValues = {
  name: string;
  slug: string;
  description: string;
  logoUrl: string;
  websiteUrl: string;
  isActive: boolean;
};

export type BrandField =
  | "name"
  | "slug"
  | "description"
  | "logoUrl"
  | "websiteUrl";
export type BrandFieldErrors = Partial<Record<BrandField, string>>;

export type BrandActionState = {
  status: "idle" | "error";
  message: string;
  fieldErrors: BrandFieldErrors;
};

export const initialBrandActionState: BrandActionState = {
  status: "idle",
  message: "",
  fieldErrors: {},
};

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export function createBrandSlug(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160)
    .replace(/-+$/g, "");
}

export function isBrandUuid(value: string) {
  return uuidPattern.test(value);
}

export function validateBrandForm(formData: FormData):
  | { success: true; data: BrandFormValues }
  | { success: false; state: BrandActionState } {
  const values: BrandFormValues = {
    name: getString(formData, "name"),
    slug: getString(formData, "slug").toLowerCase(),
    description: getString(formData, "description"),
    logoUrl: getString(formData, "logoUrl"),
    websiteUrl: getString(formData, "websiteUrl"),
    isActive: formData.get("isActive") === "on",
  };
  const fieldErrors: BrandFieldErrors = {};

  if (values.name.length < 2 || values.name.length > 120) {
    fieldErrors.name = "Enter a brand name between 2 and 120 characters.";
  }

  if (!slugPattern.test(values.slug) || values.slug.length > 160) {
    fieldErrors.slug = "Use lowercase letters, numbers, and single hyphens only.";
  }

  if (values.description.length > 500) {
    fieldErrors.description = "Keep the description within 500 characters.";
  }

  if (values.logoUrl.length > 2048) {
    fieldErrors.logoUrl = "Keep the logo URL within 2,048 characters.";
  } else if (values.logoUrl) {
    try {
      const url = new URL(values.logoUrl);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        fieldErrors.logoUrl = "Use an HTTP or HTTPS logo URL.";
      }
    } catch {
      fieldErrors.logoUrl = "Enter a complete HTTP or HTTPS logo URL.";
    }
  }

  if (values.websiteUrl.length > 2048) {
    fieldErrors.websiteUrl = "Keep the website URL within 2,048 characters.";
  } else if (values.websiteUrl) {
    try {
      const url = new URL(values.websiteUrl);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        fieldErrors.websiteUrl = "Use an HTTP or HTTPS website URL.";
      }
    } catch {
      fieldErrors.websiteUrl =
        "Enter a complete HTTP or HTTPS website URL.";
    }
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
