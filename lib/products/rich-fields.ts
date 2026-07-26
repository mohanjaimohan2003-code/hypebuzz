import type { Json } from "@/lib/types/database";

export const MAX_HIGHLIGHTS = 12;
export const MAX_SPECIFICATIONS = 30;
export const MAX_LONG_DESCRIPTION = 10_000;
export const MAX_SEO_TITLE = 200;
export const MAX_SEO_DESCRIPTION = 500;
const forbiddenSpecificationKeys = new Set(["__proto__", "prototype", "constructor"]);

export type ProductRichFields = {
  longDescription: string;
  highlights: string[];
  specifications: Record<string, string>;
  seoTitle: string;
  seoDescription: string;
};

export type RichFieldErrors = Partial<Record<
  "longDescription" | "highlights" | "specifications" | "seoTitle" | "seoDescription",
  string
>>;

function parseJson(value: string, fallback: unknown) {
  try { return JSON.parse(value) as unknown; } catch { return fallback; }
}

export function normalizeHighlights(value: unknown) {
  if (!Array.isArray(value)) return { value: [] as string[], error: "Highlights must be a list of text values." };
  if (value.some((item) => typeof item !== "string")) return { value: [] as string[], error: "Highlights must contain only text." };
  const normalized = [...new Set(value.map((item) => item.trim()).filter(Boolean))];
  if (normalized.length > MAX_HIGHLIGHTS) return { value: normalized.slice(0, MAX_HIGHLIGHTS), error: `Add no more than ${MAX_HIGHLIGHTS} highlights.` };
  if (normalized.some((item) => item.length > 300)) return { value: normalized, error: "Keep each highlight within 300 characters." };
  return { value: normalized };
}

export function normalizeSpecifications(value: unknown) {
  if (!value || typeof value !== "object") return { value: {} as Record<string, string>, error: "Specifications must be label and value pairs." };
  const entries: Array<[string, unknown]> = Array.isArray(value)
    ? value.flatMap((row) => row && typeof row === "object" && !Array.isArray(row)
      ? [[String((row as Record<string, unknown>).label ?? ""), (row as Record<string, unknown>).value]]
      : [])
    : Object.entries(value);
  if (entries.length > MAX_SPECIFICATIONS) return { value: {} as Record<string, string>, error: `Add no more than ${MAX_SPECIFICATIONS} specifications.` };
  const result: Record<string, string> = {};
  const labels = new Set<string>();
  for (const [rawLabel, rawValue] of entries) {
    const label = rawLabel.trim();
    const valueText = typeof rawValue === "string" ? rawValue.trim() : "";
    if (!label || !valueText) continue;
    if (forbiddenSpecificationKeys.has(label)) return { value: {}, error: `Specification label '${label}' is not allowed.` };
    const normalizedLabel = label.toLowerCase();
    if (labels.has(normalizedLabel)) return { value: {}, error: `Specification label '${label}' is duplicated.` };
    if (label.length > 100 || valueText.length > 500) return { value: {}, error: "Specification labels must be within 100 characters and values within 500 characters." };
    labels.add(normalizedLabel);
    result[label] = valueText;
  }
  return { value: result };
}

export function parseProductRichFields(formData: FormData): { values: ProductRichFields; errors: RichFieldErrors } {
  const longDescription = String(formData.get("longDescription") ?? "").trim();
  const seoTitle = String(formData.get("seoTitle") ?? "").trim();
  const seoDescription = String(formData.get("seoDescription") ?? "").trim();
  const highlights = normalizeHighlights(parseJson(String(formData.get("highlightsManifest") ?? "[]"), null));
  const specifications = normalizeSpecifications(parseJson(String(formData.get("specificationsManifest") ?? "{}"), null));
  const errors: RichFieldErrors = {};
  if (longDescription.length > MAX_LONG_DESCRIPTION) errors.longDescription = `Keep the long description within ${MAX_LONG_DESCRIPTION.toLocaleString()} characters.`;
  if (seoTitle.length > MAX_SEO_TITLE) errors.seoTitle = `Keep the SEO title within ${MAX_SEO_TITLE} characters.`;
  if (seoDescription.length > MAX_SEO_DESCRIPTION) errors.seoDescription = `Keep the SEO description within ${MAX_SEO_DESCRIPTION} characters.`;
  if (highlights.error) errors.highlights = highlights.error;
  if (specifications.error) errors.specifications = specifications.error;
  return {
    values: { longDescription, highlights: highlights.value, specifications: specifications.value, seoTitle, seoDescription },
    errors,
  };
}

export function richFieldsDatabasePayload(fields: ProductRichFields) {
  return {
    description: fields.longDescription || null,
    highlights: fields.highlights as Json,
    specifications: fields.specifications as Json,
    seo_title: fields.seoTitle || null,
    seo_description: fields.seoDescription || null,
  };
}
