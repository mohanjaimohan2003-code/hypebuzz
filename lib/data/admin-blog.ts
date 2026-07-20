import "server-only";
import { redirect } from "next/navigation";
import { getAdminAccess } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import type { BlogPost, BlogPostStatus } from "@/lib/types/database";
import { isUuid } from "@/lib/validation/blog";

async function requireAdmin() { const access = await getAdminAccess(); if (access.status === "unauthenticated") redirect("/admin/login"); if (access.status === "denied") redirect("/admin/access-denied"); }
export type BlogOption = { id: string; name: string };
export type AdminBlogPost = { id: string; title: string; categoryName: string | null; status: BlogPostStatus; featured: boolean; publishedAt: string | null; updatedAt: string };

export async function getAdminBlogPosts() {
  await requireAdmin(); const supabase = await createClient();
  const { data, error } = await supabase.from("blog_posts").select("id, title, status, featured, published_at, updated_at, category:blog_categories(name)").order("updated_at", { ascending: false });
  const rows = (data ?? []) as unknown as Array<{ id: string; title: string; status: BlogPostStatus; featured: boolean; published_at: string | null; updated_at: string; category: { name: string } | null }>;
  return { posts: error ? [] : rows.map((p): AdminBlogPost => ({ id: p.id, title: p.title, categoryName: p.category?.name ?? null, status: p.status, featured: p.featured, publishedAt: p.published_at, updatedAt: p.updated_at })), hasError: Boolean(error) };
}

export async function getBlogFormOptions() {
  await requireAdmin(); const supabase = await createClient();
  const [categories, tags] = await Promise.all([supabase.from("blog_categories").select("id, name").order("name"), supabase.from("blog_tags").select("id, name").order("name")]);
  return { categories: (categories.data ?? []) as BlogOption[], tags: (tags.data ?? []) as BlogOption[], hasError: Boolean(categories.error || tags.error) };
}

export async function getAdminBlogPost(id: string) {
  await requireAdmin(); if (!isUuid(id)) return { post: null, tagIds: [], categories: [], tags: [], hasError: false };
  const supabase = await createClient();
  const [post, links, options] = await Promise.all([
    supabase.from("blog_posts").select("*").eq("id", id).maybeSingle<BlogPost>(),
    supabase.from("blog_post_tags").select("tag_id").eq("post_id", id),
    getBlogFormOptions(),
  ]);
  return { post: post.error ? null : post.data, tagIds: (links.data ?? []).map((row) => row.tag_id), categories: options.categories, tags: options.tags, hasError: Boolean(post.error || links.error || options.hasError) };
}

export async function getBlogTaxonomy(kind: "categories" | "tags") {
  await requireAdmin(); const supabase = await createClient(); const table = kind === "categories" ? "blog_categories" : "blog_tags";
  const { data, error } = await supabase.from(table).select("id, name, slug, updated_at").order("name");
  return { items: (data ?? []) as Array<{ id: string; name: string; slug: string; updated_at: string }>, hasError: Boolean(error) };
}
