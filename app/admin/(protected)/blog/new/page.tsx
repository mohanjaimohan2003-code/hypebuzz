import type { Metadata } from "next";
import Link from "next/link";
import { BlogPostForm } from "@/components/admin/blog-post-form";
import { getBlogFormOptions } from "@/lib/data/admin-blog";
export const metadata: Metadata = { title: "New Article | HypeBuzz Admin" };
export default async function NewBlogPostPage() { const { categories, tags, hasError } = await getBlogFormOptions(); return <div className="mx-auto max-w-5xl"><Link className="text-sm font-semibold text-[#1D4ED8]" href="/admin/blog">← Back to Knowledge Hub</Link><header className="mt-4"><p className="text-sm font-semibold text-[#2563EB]">Content management</p><h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">New Article</h1><p className="mt-3 text-[#6B7280]">Create a draft now and publish only when the content is ready.</p></header>{hasError ? <p className="mt-6 rounded-[10px] border border-[#FCA5A5] bg-[#FEF2F2] p-4 text-sm text-[#991B1B]" role="alert">Categories or tags could not be loaded.</p> : null}<BlogPostForm categories={categories} mode="create" tags={tags}/></div>; }
