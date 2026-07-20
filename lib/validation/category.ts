export type CategoryFormValues = {
  name: string;
  slug: string;
  description: string;
  iconUrl: string;
  displayOrder: number;
  isActive: boolean;
};

export type CategoryField =
  | "name"
  | "slug"
  | "description"
  | "iconUrl"
  | "displayOrder";

export type CategoryFieldErrors = Partial<Record<CategoryField, string>>;

export type CategoryActionState = {
  status: "idle" | "error";
  message: string;
  fieldErrors: CategoryFieldErrors;
};

export const initialCategoryActionState: CategoryActionState = {
  status: "idle",
  message: "",
  fieldErrors: {},
};

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export function createCategorySlug(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160)
    .replace(/-+$/g, "");
}

export function isCategoryUuid(value: string) {
  return uuidPattern.test(value);
}

export function validateCategoryForm(formData: FormData):
  | { success: true; data: CategoryFormValues }
  | { success: false; state: CategoryActionState } {
  const displayOrderInput = getString(formData, "displayOrder");
  const values: CategoryFormValues = {
    name: getString(formData, "name"),
    slug: getString(formData, "slug").toLowerCase(),
    description: getString(formData, "description"),
    iconUrl: getString(formData, "iconUrl"),
    displayOrder: /^\d+$/.test(displayOrderInput)
      ? Number(displayOrderInput)
      : Number.NaN,
    isActive: formData.get("isActive") === "on",
  };
  const fieldErrors: CategoryFieldErrors = {};

  if (values.name.length < 2 || values.name.length > 120) {
    fieldErrors.name = "Enter a category name between 2 and 120 characters.";
  }

  if (!slugPattern.test(values.slug) || values.slug.length > 160) {
    fieldErrors.slug = "Use lowercase letters, numbers, and single hyphens only.";
  }

  if (values.description.length > 500) {
    fieldErrors.description = "Keep the description within 500 characters.";
  }

  if (values.iconUrl.length > 2048) {
    fieldErrors.iconUrl = "Keep the icon URL within 2,048 characters.";
  } else if (values.iconUrl) {
    try {
      const url = new URL(values.iconUrl);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        fieldErrors.iconUrl = "Use an HTTP or HTTPS icon URL.";
      }
    } catch {
      fieldErrors.iconUrl = "Enter a complete HTTP or HTTPS icon URL.";
    }
  }

  if (
    !Number.isSafeInteger(values.displayOrder) ||
    values.displayOrder < 0 ||
    values.displayOrder > 1_000_000
  ) {
    fieldErrors.displayOrder =
      "Enter a whole-number display order between 0 and 1,000,000.";
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
