import type { BlogPostStatus } from "@/lib/types/database";

export type BlogField = "title" | "slug" | "excerpt" | "content" | "coverImageUrl" | "authorName" | "categoryId" | "status" | "seoTitle" | "seoDescription" | "publishedAt" | "tagIds";
export type BlogActionState = { status: "idle" | "error"; message: string; fieldErrors: Partial<Record<BlogField, string>> };
export const initialBlogActionState: BlogActionState = { status: "idle", message: "", fieldErrors: {} };

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const text = (data: FormData, key: string) => String(data.get(key) ?? "").trim();
export const isUuid = (value: string) => uuidPattern.test(value);
export function createBlogSlug(value: string) { return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 160).replace(/-+$/g, ""); }

export type BlogFormValues = {
  title: string; slug: string; excerpt: string; content: string; coverImageUrl: string;
  authorName: string; categoryId: string; tagIds: string[]; status: BlogPostStatus;
  featured: boolean; seoTitle: string; seoDescription: string; publishedAt: string;
};

export function validateBlogForm(data: FormData): { success: true; data: BlogFormValues } | { success: false; state: BlogActionState } {
  const values: BlogFormValues = {
    title: text(data, "title"), slug: text(data, "slug").toLowerCase(), excerpt: text(data, "excerpt"),
    content: text(data, "content"), coverImageUrl: text(data, "coverImageUrl"), authorName: text(data, "authorName"),
    categoryId: text(data, "categoryId"), tagIds: data.getAll("tagIds").map(String).filter(Boolean),
    status: text(data, "status") as BlogPostStatus, featured: data.get("featured") === "on",
    seoTitle: text(data, "seoTitle"), seoDescription: text(data, "seoDescription"), publishedAt: text(data, "publishedAt"),
  };
  const fieldErrors: BlogActionState["fieldErrors"] = {};
  if (!values.title || values.title.length > 200) fieldErrors.title = "Enter a title between 1 and 200 characters.";
  if (!slugPattern.test(values.slug) || values.slug.length > 160) fieldErrors.slug = "Use lowercase letters, numbers, and single hyphens only.";
  if (values.status !== "draft" && values.status !== "published" && values.status !== "archived") fieldErrors.status = "Select Draft, Published, or Archived.";
  if (values.status === "published" && !values.content) fieldErrors.content = "Content is required before publishing.";
  if (values.status === "published" && !values.publishedAt) fieldErrors.publishedAt = "Set a published date before publishing.";
  if (values.seoTitle.length > 60) fieldErrors.seoTitle = "Keep the SEO title within 60 characters.";
  if (values.seoDescription.length > 160) fieldErrors.seoDescription = "Keep the SEO description within 160 characters.";
  if (values.categoryId && !isUuid(values.categoryId)) fieldErrors.categoryId = "Select a valid category.";
  if (values.tagIds.some((id) => !isUuid(id))) fieldErrors.tagIds = "Select valid tags.";
  if (values.coverImageUrl) { try { const url = new URL(values.coverImageUrl); if (!['http:', 'https:'].includes(url.protocol)) throw new Error(); } catch { fieldErrors.coverImageUrl = "Enter a complete HTTP or HTTPS image URL."; } }
  if (values.publishedAt && Number.isNaN(new Date(values.publishedAt).getTime())) fieldErrors.publishedAt = "Enter a valid published date.";
  if (Object.keys(fieldErrors).length) return { success: false, state: { status: "error", message: "Review the highlighted fields and try again.", fieldErrors } };
  return { success: true, data: values };
}
