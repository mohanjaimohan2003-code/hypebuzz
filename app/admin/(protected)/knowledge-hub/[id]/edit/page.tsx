import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { KnowledgeHubForm } from "@/components/admin/knowledge-hub-form";
import { getAdminGuide } from "@/lib/data/admin-knowledge-hub";
export const metadata: Metadata = { title: "Edit PDF Guide | HypeBuzz Admin" };
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; const item = await getAdminGuide(id); if (!item) notFound(); return <div className="mx-auto max-w-4xl"><Link className="inline-flex min-h-11 items-center font-semibold text-[#1D4ED8]" href="/admin/knowledge-hub">← PDF guides</Link><h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Edit PDF guide</h1><p className="mt-3 text-[#6B7280]">Replace files or update publishing details.</p><KnowledgeHubForm item={item}/></div>; }
