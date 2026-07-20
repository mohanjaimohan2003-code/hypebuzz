"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { createBlogPost, updateBlogPost } from "@/app/admin/(protected)/blog/actions";
import type { BlogOption } from "@/lib/data/admin-blog";
import type { BlogPostStatus } from "@/lib/types/database";
import { createBlogSlug, initialBlogActionState, type BlogField } from "@/lib/validation/blog";

export type BlogPostFormValue = { id: string; title: string; slug: string; excerpt: string; content: string; coverImageUrl: string; authorName: string; categoryId: string; tagIds: string[]; status: BlogPostStatus; featured: boolean; seoTitle: string; seoDescription: string; publishedAt: string };
type Props = { mode: "create" | "edit"; categories: BlogOption[]; tags: BlogOption[]; post?: BlogPostFormValue };
const input = "mt-2 min-h-12 w-full rounded-[10px] border border-[#D1D5DB] bg-white px-4 text-sm text-[#111827] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 disabled:bg-[#F3F4F6]";

export function BlogPostForm({ mode, categories, tags, post }: Props) {
  const [title, setTitle] = useState(post?.title ?? ""); const [slug, setSlug] = useState(post?.slug ?? ""); const [editedSlug, setEditedSlug] = useState(mode === "edit");
  const action = mode === "create" ? createBlogPost : updateBlogPost.bind(null, post?.id ?? ""); const [state, formAction, pending] = useActionState(action, initialBlogActionState);
  const error = (field: BlogField) => state.fieldErrors[field] ? <p className="mt-2 text-sm font-medium text-[#B91C1C]" id={`${field}-error`}>{state.fieldErrors[field]}</p> : null;
  const aria = (field: BlogField) => ({ "aria-invalid": Boolean(state.fieldErrors[field]), "aria-describedby": state.fieldErrors[field] ? `${field}-error` : undefined });
  return <form action={formAction} className="mt-8 space-y-8">
    {state.status === "error" ? <div className="rounded-[10px] border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-3 text-sm font-medium text-[#991B1B]" role="alert">{state.message}</div> : null}
    <fieldset className="rounded-2xl border border-[#E5E7EB] bg-white p-5 sm:p-6"><legend className="px-1 text-lg font-bold">Article</legend><div className="mt-2 grid gap-6 lg:grid-cols-2">
      <div><label className="text-sm font-semibold" htmlFor="blog-title">Title</label><input {...aria("title")} className={input} disabled={pending} id="blog-title" maxLength={200} name="title" onChange={(e) => { setTitle(e.target.value); if (!editedSlug) setSlug(createBlogSlug(e.target.value)); }} required value={title}/>{error("title")}</div>
      <div><label className="text-sm font-semibold" htmlFor="blog-slug">Slug</label><input {...aria("slug")} className={input} disabled={pending} id="blog-slug" maxLength={160} name="slug" onChange={(e) => { setEditedSlug(true); setSlug(e.target.value.toLowerCase()); }} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required value={slug}/>{error("slug")}</div>
      <div className="lg:col-span-2"><label className="text-sm font-semibold" htmlFor="blog-excerpt">Excerpt</label><textarea className={`${input} min-h-24 py-3`} defaultValue={post?.excerpt} disabled={pending} id="blog-excerpt" name="excerpt"/></div>
      <div className="lg:col-span-2"><label className="text-sm font-semibold" htmlFor="blog-content">Content (Markdown)</label><textarea {...aria("content")} className={`${input} min-h-80 py-3 font-mono`} defaultValue={post?.content} disabled={pending} id="blog-content" name="content"/><p className="mt-2 text-xs text-[#6B7280]">Required only when publishing. Plain Markdown only.</p>{error("content")}</div>
      <div><label className="text-sm font-semibold" htmlFor="blog-cover">Cover image URL</label><input {...aria("coverImageUrl")} className={input} defaultValue={post?.coverImageUrl} disabled={pending} id="blog-cover" name="coverImageUrl" type="url"/>{error("coverImageUrl")}</div>
      <div><label className="text-sm font-semibold" htmlFor="blog-author">Author name</label><input className={input} defaultValue={post?.authorName} disabled={pending} id="blog-author" name="authorName"/></div>
      <div><label className="text-sm font-semibold" htmlFor="blog-category">Category</label><select className={input} defaultValue={post?.categoryId} disabled={pending} id="blog-category" name="categoryId"><option value="">No category</option>{categories.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></div>
      <div><label className="text-sm font-semibold" htmlFor="blog-tags">Tags</label><select className={`${input} min-h-32 py-2`} defaultValue={post?.tagIds} disabled={pending} id="blog-tags" multiple name="tagIds">{tags.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select><p className="mt-2 text-xs text-[#6B7280]">Use Ctrl or Command to select multiple tags.</p></div>
    </div></fieldset>
    <fieldset className="rounded-2xl border border-[#E5E7EB] bg-white p-5 sm:p-6"><legend className="px-1 text-lg font-bold">Publishing and SEO</legend><div className="mt-2 grid gap-6 lg:grid-cols-2">
      <div><label className="text-sm font-semibold" htmlFor="blog-status">Status</label><select {...aria("status")} className={input} defaultValue={post?.status ?? "draft"} disabled={pending} id="blog-status" name="status"><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select>{error("status")}</div>
      <div><label className="text-sm font-semibold" htmlFor="blog-published">Published date</label><input {...aria("publishedAt")} className={input} defaultValue={post?.publishedAt} disabled={pending} id="blog-published" name="publishedAt" type="datetime-local"/>{error("publishedAt")}</div>
      <label className="flex min-h-12 items-center gap-3 rounded-[10px] border border-[#E5E7EB] px-4 text-sm font-semibold"><input className="h-5 w-5 accent-[#2563EB]" defaultChecked={post?.featured} disabled={pending} name="featured" type="checkbox"/>Featured article</label><div/>
      <div><label className="text-sm font-semibold" htmlFor="blog-seo-title">SEO title</label><input {...aria("seoTitle")} className={input} defaultValue={post?.seoTitle} disabled={pending} id="blog-seo-title" maxLength={60} name="seoTitle"/>{error("seoTitle")}</div>
      <div><label className="text-sm font-semibold" htmlFor="blog-seo-description">SEO description</label><textarea {...aria("seoDescription")} className={`${input} min-h-24 py-3`} defaultValue={post?.seoDescription} disabled={pending} id="blog-seo-description" maxLength={160} name="seoDescription"/>{error("seoDescription")}</div>
    </div></fieldset>
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Link className="inline-flex min-h-12 items-center justify-center rounded-[10px] border border-[#D1D5DB] bg-white px-5 text-sm font-semibold" href="/admin/blog">Cancel</Link><button className="min-h-12 rounded-[10px] bg-[#2563EB] px-6 text-sm font-semibold text-white disabled:bg-[#93C5FD]" disabled={pending} type="submit">{pending ? "Saving…" : mode === "create" ? "Create article" : "Save changes"}</button></div>
  </form>;
}
