import "server-only";
import { redirect } from "next/navigation";
import { getAdminAccess } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import type { KnowledgeHubItem } from "@/lib/types/database";
import { isUuid } from "@/lib/validation/knowledge-hub";

async function requireAdmin() { const access = await getAdminAccess(); if (access.status === "unauthenticated") redirect("/admin/login"); if (access.status === "denied") redirect("/admin/access-denied"); }
export async function getAdminGuides(search = "", status = "", category = "") {
  await requireAdmin(); const supabase = await createClient(); let query = supabase.from("knowledge_hub_items").select("*").order("created_at", { ascending: false });
  if (search.trim()) query = query.ilike("title", `%${search.trim().replace(/[%_]/g, "")}%`); if (status) query = query.eq("status", status); if (category) query = query.eq("category", category);
  const { data, error } = await query.returns<KnowledgeHubItem[]>();
  const guides = await Promise.all((data ?? []).map(async (item) => { const [pdf, thumb] = await Promise.all([supabase.storage.from("knowledge-hub-pdfs").createSignedUrl(item.pdf_storage_path, 3600), item.thumbnail_storage_path ? supabase.storage.from("knowledge-hub-thumbnails").createSignedUrl(item.thumbnail_storage_path, 3600) : Promise.resolve({ data: null })]); return { ...item, pdf_url: pdf.data?.signedUrl ?? "", thumbnail_url: thumb.data?.signedUrl ?? null }; }));
  return { guides: error ? [] : guides, hasError: Boolean(error) };
}
export async function getAdminGuide(id: string) { await requireAdmin(); if (!isUuid(id)) return null; const supabase = await createClient(); const { data, error } = await supabase.from("knowledge_hub_items").select("*").eq("id", id).maybeSingle<KnowledgeHubItem>(); if (error || !data) return null; const [pdf, thumb] = await Promise.all([supabase.storage.from("knowledge-hub-pdfs").createSignedUrl(data.pdf_storage_path, 3600), data.thumbnail_storage_path ? supabase.storage.from("knowledge-hub-thumbnails").createSignedUrl(data.thumbnail_storage_path, 3600) : Promise.resolve({ data: null })]); return { ...data, pdf_url: pdf.data?.signedUrl ?? "", thumbnail_url: thumb.data?.signedUrl ?? null }; }
