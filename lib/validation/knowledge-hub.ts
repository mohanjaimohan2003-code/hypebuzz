import type { KnowledgeHubStatus } from "@/lib/types/database";

export const KNOWLEDGE_HUB_CATEGORIES = ["Buying Guides", "Technology", "Product Guides", "Comparisons", "How-To"] as const;
export const MAX_PDF_BYTES = 25 * 1024 * 1024;
export const MAX_THUMBNAIL_BYTES = 5 * 1024 * 1024;
export const slugifyGuide = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
export type GuideField = "pdf" | "thumbnail" | "title" | "slug" | "description" | "category";
export type GuideActionState = { status: "idle" | "error"; message: string; fieldErrors: Partial<Record<GuideField, string>> };
export const initialGuideActionState: GuideActionState = { status: "idle", message: "", fieldErrors: {} };

export function validateGuideFields(formData: FormData, needsPdf: boolean) {
  const title = String(formData.get("title") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const authorName = String(formData.get("authorName") ?? "").trim();
  const status: KnowledgeHubStatus = formData.get("intent") === "publish" ? "published" : "draft";
  const tags = [...new Set(String(formData.get("tags") ?? "").split(",").map((x) => x.trim()).filter(Boolean))].slice(0, 20);
  const pdf = formData.get("pdf"); const thumbnail = formData.get("thumbnail");
  const errors: Partial<Record<GuideField, string>> = {};
  if (!title || title.length > 200) errors.title = "Enter a title of up to 200 characters.";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) errors.slug = "Use lowercase letters, numbers, and single hyphens.";
  if (!description || description.length > 500) errors.description = "Enter a description of up to 500 characters.";
  if (!KNOWLEDGE_HUB_CATEGORIES.includes(category as typeof KNOWLEDGE_HUB_CATEGORIES[number])) errors.category = "Choose a valid category.";
  if (needsPdf && (!(pdf instanceof File) || pdf.size === 0)) errors.pdf = "Choose a PDF file.";
  if (pdf instanceof File && pdf.size > 0 && pdf.size > MAX_PDF_BYTES) errors.pdf = "PDFs must be 25 MB or smaller.";
  if (thumbnail instanceof File && thumbnail.size > MAX_THUMBNAIL_BYTES) errors.thumbnail = "Images must be 5 MB or smaller.";
  return { success: !Object.keys(errors).length, errors, data: { title, slug, description, category, authorName, tags, status, pdf: pdf instanceof File && pdf.size ? pdf : null, thumbnail: thumbnail instanceof File && thumbnail.size ? thumbnail : null, removeThumbnail: formData.get("removeThumbnail") === "true" } };
}
