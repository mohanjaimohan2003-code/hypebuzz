"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminAccess } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { isUuid, validateBlogForm, type BlogActionState, type BlogFormValues } from "@/lib/validation/blog";

export type TaxonomyActionState = { status: "idle" | "error"; message: string };
export const initialTaxonomyActionState: TaxonomyActionState = { status: "idle", message: "" };
async function authorized() { return (await getAdminAccess()).status === "authenticated"; }
const authError = (): BlogActionState => ({ status: "error", message: "Your admin session is not authorized for this action.", fieldErrors: {} });
function dbError(error: { code?: string } | null): BlogActionState {
  if (error?.code === "23505") return { status: "error", message: "That slug is already in use.", fieldErrors: { slug: "Choose a unique slug." } };
  if (error?.code === "23503") return { status: "error", message: "A selected category or tag is no longer available.", fieldErrors: {} };
  return { status: "error", message: "The article could not be saved. Please try again.", fieldErrors: {} };
}
function payload(v: BlogFormValues) { return { title: v.title, slug: v.slug, excerpt: v.excerpt || null, content: v.content || null, cover_image_url: v.coverImageUrl || null, author_name: v.authorName || null, category_id: v.categoryId || null, status: v.status, featured: v.featured, seo_title: v.seoTitle || null, seo_description: v.seoDescription || null, published_at: v.publishedAt ? new Date(v.publishedAt).toISOString() : null }; }
function refresh() { revalidatePath("/admin/blog", "layout"); revalidatePath("/knowledge-hub"); revalidatePath("/sitemap.xml"); }

async function replaceTags(postId: string, tagIds: string[]) {
  const supabase = await createClient(); const deleted = await supabase.from("blog_post_tags").delete().eq("post_id", postId);
  if (deleted.error || !tagIds.length) return deleted.error;
  const inserted = await supabase.from("blog_post_tags").insert([...new Set(tagIds)].map((tag_id) => ({ post_id: postId, tag_id })));
  return inserted.error;
}

export async function createBlogPost(_state: BlogActionState, formData: FormData): Promise<BlogActionState> {
  void _state;
  if (!(await authorized())) return authError(); const validation = validateBlogForm(formData); if (!validation.success) return validation.state;
  const supabase = await createClient(); const { data, error } = await supabase.from("blog_posts").insert(payload(validation.data)).select("id").single();
  if (error || !data) return dbError(error); const tagError = await replaceTags(data.id, validation.data.tagIds); if (tagError) return dbError(tagError);
  refresh(); redirect("/admin/blog?notice=created");
}

export async function updateBlogPost(id: string, _state: BlogActionState, formData: FormData): Promise<BlogActionState> {
  void _state;
  if (!(await authorized())) return authError(); if (!isUuid(id)) return { status: "error", message: "The article could not be found.", fieldErrors: {} };
  const validation = validateBlogForm(formData); if (!validation.success) return validation.state;
  const supabase = await createClient(); const { data, error } = await supabase.from("blog_posts").update(payload(validation.data)).eq("id", id).select("id").maybeSingle();
  if (error) return dbError(error); if (!data) return { status: "error", message: "The article could not be found.", fieldErrors: {} };
  const tagError = await replaceTags(id, validation.data.tagIds); if (tagError) return dbError(tagError);
  refresh(); redirect("/admin/blog?notice=updated");
}

export async function deleteBlogPost(id: string, _state: BlogActionState): Promise<BlogActionState> {
  void _state;
  if (!(await authorized())) return authError(); if (!isUuid(id)) return { status: "error", message: "The article could not be found.", fieldErrors: {} };
  const supabase = await createClient(); const { data, error } = await supabase.from("blog_posts").delete().eq("id", id).select("id").maybeSingle();
  if (error) return dbError(error); if (!data) return { status: "error", message: "The article could not be found.", fieldErrors: {} };
  refresh(); redirect("/admin/blog?notice=deleted");
}

export async function createBlogTaxonomy(kind: "categories" | "tags", _state: TaxonomyActionState, formData: FormData): Promise<TaxonomyActionState> {
  void _state;
  if (!(await authorized())) return { status: "error", message: "Your admin session is not authorized." };
  const name = String(formData.get("name") ?? "").trim(); const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  if (!name || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return { status: "error", message: "Enter a name and a lowercase slug using letters, numbers, and hyphens." };
  const supabase = await createClient();
  const result = kind === "categories"
    ? await supabase.from("blog_categories").insert({ name, slug, description: String(formData.get("description") ?? "").trim() || null })
    : await supabase.from("blog_tags").insert({ name, slug });
  const { error } = result; if (error?.code === "23505") return { status: "error", message: "That slug is already in use." }; if (error) return { status: "error", message: `The blog ${kind === "categories" ? "category" : "tag"} could not be created.` };
  revalidatePath(`/admin/blog/${kind}`); redirect(`/admin/blog/${kind}?notice=created`);
}

export async function deleteBlogTaxonomy(kind: "categories" | "tags", id: string, _state: TaxonomyActionState): Promise<TaxonomyActionState> {
  void _state;
  if (!(await authorized())) return { status: "error", message: "Your admin session is not authorized." }; if (!isUuid(id)) return { status: "error", message: "The record could not be found." };
  const supabase = await createClient(); const table = kind === "categories" ? "blog_categories" : "blog_tags"; const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) return { status: "error", message: `The blog ${kind === "categories" ? "category" : "tag"} could not be deleted.` };
  revalidatePath(`/admin/blog/${kind}`); redirect(`/admin/blog/${kind}?notice=deleted`);
}
