import type { Metadata } from "next";
import Link from "next/link";
import { BlogTaxonomyManager } from "@/components/admin/blog-taxonomy-manager";
import { getBlogTaxonomy } from "@/lib/data/admin-blog";
export const metadata: Metadata = { title: "Blog Tags | HypeBuzz Admin" };
export default async function BlogTagsPage() { const { items, hasError } = await getBlogTaxonomy("tags"); return <div><Link className="text-sm font-semibold text-[#1D4ED8]" href="/admin/blog">← Back to Knowledge Hub</Link><h1 className="mt-4 text-3xl font-bold">Blog Tags</h1><p className="mt-3 text-[#6B7280]">Maintain reusable tags for future articles.</p>{hasError ? <p className="mt-4 text-[#B91C1C]">Tags could not be loaded.</p> : null}<BlogTaxonomyManager items={items} kind="tags"/></div>; }
