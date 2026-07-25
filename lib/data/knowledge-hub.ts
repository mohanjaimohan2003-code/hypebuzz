import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { KnowledgeHubItem } from "@/lib/types/database";

async function signAssets(supabase: Awaited<ReturnType<typeof createClient>>, item: KnowledgeHubItem) {
  const [pdf, thumbnail] = await Promise.all([
    supabase.storage.from("knowledge-hub-pdfs").createSignedUrl(item.pdf_storage_path, 3600),
    item.thumbnail_storage_path ? supabase.storage.from("knowledge-hub-thumbnails").createSignedUrl(item.thumbnail_storage_path, 3600) : Promise.resolve({ data: null }),
  ]);
  return { ...item, pdf_url: pdf.data?.signedUrl ?? "", thumbnail_url: thumbnail.data?.signedUrl ?? null };
}

export async function getPublishedGuides(search = "", category = "") {
  const supabase = await createClient();
  let query = supabase.from("knowledge_hub_items").select("*").eq("status", "published").order("published_at", { ascending: false });
  if (search.trim()) query = query.or(`title.ilike.%${search.trim().replace(/[%_,()]/g, "") }%,description.ilike.%${search.trim().replace(/[%_,()]/g, "")}%`);
  if (category) query = query.eq("category", category);
  const { data, error } = await query.returns<KnowledgeHubItem[]>();
  return { guides: error ? [] : await Promise.all((data ?? []).map((item) => signAssets(supabase, item))), hasError: Boolean(error) };
}
export async function getPublishedGuide(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("knowledge_hub_items").select("*").eq("slug", slug).eq("status", "published").maybeSingle<KnowledgeHubItem>();
  return error || !data ? null : signAssets(supabase, data);
}
export async function getRelatedGuides(item: KnowledgeHubItem) {
  const supabase = await createClient();
  const { data } = await supabase.from("knowledge_hub_items").select("*").eq("status", "published").eq("category", item.category).neq("id", item.id).limit(3).returns<KnowledgeHubItem[]>();
  return Promise.all((data ?? []).map((related) => signAssets(supabase, related)));
}
