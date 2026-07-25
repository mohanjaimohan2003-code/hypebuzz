"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminAccess } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import type { KnowledgeHubItem, KnowledgeHubStatus } from "@/lib/types/database";
import { initialGuideActionState, isUuid, validateGuideFields, type GuideActionState } from "@/lib/validation/knowledge-hub";

const PDF_BUCKET = "knowledge-hub-pdfs"; const IMAGE_BUCKET = "knowledge-hub-thumbnails";
async function authorized() { return (await getAdminAccess()).status === "authenticated"; }
function authError(): GuideActionState { return { status: "error", message: "Your admin session has expired or is not authorized.", fieldErrors: {} }; }
function refresh() { revalidatePath("/admin/knowledge-hub", "layout"); revalidatePath("/knowledge-hub", "layout"); revalidatePath("/sitemap.xml"); }
function safeName(name: string, fallback: string) { const base = name.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80); return base || fallback; }
async function isPdf(file: File) { const bytes = new Uint8Array(await file.slice(0, 5).arrayBuffer()); return bytes.length === 5 && String.fromCharCode(...bytes) === "%PDF-"; }
async function imageExtension(file: File) { const b = new Uint8Array(await file.slice(0, 12).arrayBuffer()); if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpg"; if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "png"; if (String.fromCharCode(...b.slice(0, 4)) === "RIFF" && String.fromCharCode(...b.slice(8, 12)) === "WEBP") return "webp"; return null; }
function publicUrl(supabase: Awaited<ReturnType<typeof createClient>>, bucket: string, path: string) { return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl; }
async function removeAssets(supabase: Awaited<ReturnType<typeof createClient>>, assets: Array<[string, string | null]>) { await Promise.all(assets.filter((x): x is [string, string] => Boolean(x[1])).map(([bucket, path]) => supabase.storage.from(bucket).remove([path]))); }
function dbError(error: { code?: string } | null): GuideActionState { return error?.code === "23505" ? { status: "error", message: "That slug is already in use.", fieldErrors: { slug: "Choose a unique slug." } } : { status: "error", message: "The guide could not be saved. Please try again.", fieldErrors: {} }; }

export async function createGuide(_state: GuideActionState, formData: FormData): Promise<GuideActionState> {
  void _state; if (!(await authorized())) return authError(); const v = validateGuideFields(formData, true); if (!v.success) return { status: "error", message: "Check the highlighted fields.", fieldErrors: v.errors };
  const { data } = v; if (!data.pdf || !(await isPdf(data.pdf))) return { status: "error", message: "The selected file is not a valid PDF.", fieldErrors: { pdf: "Choose a genuine PDF file." } };
  let imageExt: string | null = null;
  if (data.thumbnail) {
    imageExt = await imageExtension(data.thumbnail);
    if (!imageExt) {
      return { status: "error", message: "The thumbnail must be a JPG, PNG, or WebP image.", fieldErrors: { thumbnail: "Choose a valid image." } };
    }
  }
  const supabase = await createClient(); const id = crypto.randomUUID(); const nonce = crypto.randomUUID(); const pdfPath = `knowledge-hub/${id}/${nonce}-${safeName(data.pdf.name, "guide")}.pdf`;
  const pdfUpload = await supabase.storage.from(PDF_BUCKET).upload(pdfPath, data.pdf, { contentType: "application/pdf", upsert: false }); if (pdfUpload.error) return { status: "error", message: "The PDF upload failed. Check your connection and try again.", fieldErrors: { pdf: "Upload failed." } };
  let thumbnailPath: string | null = null; if (data.thumbnail && imageExt) { thumbnailPath = `knowledge-hub/${id}/${crypto.randomUUID()}-${safeName(data.thumbnail.name, "thumbnail")}.${imageExt}`; const upload = await supabase.storage.from(IMAGE_BUCKET).upload(thumbnailPath, data.thumbnail, { contentType: imageExt === "jpg" ? "image/jpeg" : `image/${imageExt}`, upsert: false }); if (upload.error) { await removeAssets(supabase, [[PDF_BUCKET, pdfPath]]); return { status: "error", message: "The thumbnail upload failed. Please try again.", fieldErrors: { thumbnail: "Upload failed." } }; } }
  const now = new Date().toISOString(); const { error } = await supabase.from("knowledge_hub_items").insert({ id, title: data.title, slug: data.slug, description: data.description, category: data.category, tags: data.tags, author_name: data.authorName || null, pdf_url: publicUrl(supabase, PDF_BUCKET, pdfPath), pdf_storage_path: pdfPath, thumbnail_url: thumbnailPath ? publicUrl(supabase, IMAGE_BUCKET, thumbnailPath) : null, thumbnail_storage_path: thumbnailPath, pdf_size_bytes: data.pdf.size, status: data.status, published_at: data.status === "published" ? now : null });
  if (error) { await removeAssets(supabase, [[PDF_BUCKET, pdfPath], [IMAGE_BUCKET, thumbnailPath]]); return dbError(error); } refresh(); redirect("/admin/knowledge-hub?notice=created");
}

export async function updateGuide(id: string, _state: GuideActionState, formData: FormData): Promise<GuideActionState> {
  void _state; if (!(await authorized())) return authError(); if (!isUuid(id)) return { ...initialGuideActionState, status: "error", message: "Guide not found." }; const v = validateGuideFields(formData, false); if (!v.success) return { status: "error", message: "Check the highlighted fields.", fieldErrors: v.errors };
  const supabase = await createClient(); const existingResult = await supabase.from("knowledge_hub_items").select("*").eq("id", id).maybeSingle<KnowledgeHubItem>(); const existing = existingResult.data; if (!existing) return { ...initialGuideActionState, status: "error", message: "Guide not found." };
  const { data } = v; let pdfPath = existing.pdf_storage_path, pdfUrl = existing.pdf_url, pdfSize = existing.pdf_size_bytes, newPdf: string | null = null; let thumbPath = existing.thumbnail_storage_path, thumbUrl = existing.thumbnail_url, newThumb: string | null = null;
  if (data.pdf) { if (!(await isPdf(data.pdf))) return { status: "error", message: "The selected file is not a valid PDF.", fieldErrors: { pdf: "Choose a genuine PDF file." } }; newPdf = `knowledge-hub/${id}/${crypto.randomUUID()}-${safeName(data.pdf.name, "guide")}.pdf`; const upload = await supabase.storage.from(PDF_BUCKET).upload(newPdf, data.pdf, { contentType: "application/pdf" }); if (upload.error) return { status: "error", message: "The PDF upload failed.", fieldErrors: { pdf: "Upload failed." } }; pdfPath = newPdf; pdfUrl = publicUrl(supabase, PDF_BUCKET, newPdf); pdfSize = data.pdf.size; }
  if (data.thumbnail) {
    const ext = await imageExtension(data.thumbnail);
    if (!ext) {
      await removeAssets(supabase, [[PDF_BUCKET, newPdf]]);
      return { status: "error", message: "The thumbnail must be a JPG, PNG, or WebP image.", fieldErrors: { thumbnail: "Choose a valid image." } };
    }
    newThumb = `knowledge-hub/${id}/${crypto.randomUUID()}-${safeName(data.thumbnail.name, "thumbnail")}.${ext}`;
    const upload = await supabase.storage.from(IMAGE_BUCKET).upload(newThumb, data.thumbnail, { contentType: ext === "jpg" ? "image/jpeg" : `image/${ext}` });
    if (upload.error) {
      await removeAssets(supabase, [[PDF_BUCKET, newPdf]]);
      return { status: "error", message: "The thumbnail upload failed.", fieldErrors: { thumbnail: "Upload failed." } };
    }
    thumbPath = newThumb; thumbUrl = publicUrl(supabase, IMAGE_BUCKET, newThumb);
  } else if (data.removeThumbnail) { thumbPath = null; thumbUrl = null; }
  const publishedAt = data.status === "published" ? existing.published_at ?? new Date().toISOString() : existing.published_at; const { error } = await supabase.from("knowledge_hub_items").update({ title: data.title, slug: data.slug, description: data.description, category: data.category, tags: data.tags, author_name: data.authorName || null, pdf_url: pdfUrl, pdf_storage_path: pdfPath, pdf_size_bytes: pdfSize, thumbnail_url: thumbUrl, thumbnail_storage_path: thumbPath, status: data.status, published_at: publishedAt }).eq("id", id);
  if (error) { await removeAssets(supabase, [[PDF_BUCKET, newPdf], [IMAGE_BUCKET, newThumb]]); return dbError(error); } await removeAssets(supabase, [[PDF_BUCKET, newPdf ? existing.pdf_storage_path : null], [IMAGE_BUCKET, newThumb || data.removeThumbnail ? existing.thumbnail_storage_path : null]]); refresh(); redirect("/admin/knowledge-hub?notice=updated");
}

export async function setGuideStatus(id: string, status: KnowledgeHubStatus) { if (!(await authorized()) || !isUuid(id) || !["draft", "published"].includes(status)) return; const supabase = await createClient(); const { data } = await supabase.from("knowledge_hub_items").select("published_at").eq("id", id).maybeSingle<{ published_at: string | null }>(); await supabase.from("knowledge_hub_items").update({ status, published_at: status === "published" ? data?.published_at ?? new Date().toISOString() : data?.published_at ?? null }).eq("id", id); refresh(); }
export async function deleteGuide(id: string) { if (!(await authorized()) || !isUuid(id)) return; const supabase = await createClient(); const { data } = await supabase.from("knowledge_hub_items").select("pdf_storage_path,thumbnail_storage_path").eq("id", id).maybeSingle<{ pdf_storage_path: string; thumbnail_storage_path: string | null }>(); if (!data) return; const { error } = await supabase.from("knowledge_hub_items").delete().eq("id", id); if (!error) await removeAssets(supabase, [[PDF_BUCKET, data.pdf_storage_path], [IMAGE_BUCKET, data.thumbnail_storage_path]]); refresh(); redirect("/admin/knowledge-hub?notice=deleted"); }
