import type { Metadata } from "next";
import Link from "next/link";
import { KnowledgeHubForm } from "@/components/admin/knowledge-hub-form";
export const metadata: Metadata = { title: "Upload PDF Guide | HypeBuzz Admin" };
export default function Page() { return <div className="mx-auto max-w-4xl"><Link className="inline-flex min-h-11 items-center font-semibold text-[#1D4ED8]" href="/admin/knowledge-hub">← PDF guides</Link><h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Upload PDF guide</h1><p className="mt-3 text-[#6B7280]">Save it privately as a draft or publish it to the Knowledge Hub.</p><KnowledgeHubForm/></div>; }
