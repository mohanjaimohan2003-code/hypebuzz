"use server";
import { revalidatePath } from "next/cache";
import { getAdminAccess } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import type { ReviewStatus } from "@/lib/reviews/model";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export type ReviewModerationResult = { status: "idle" | "success" | "error"; message: string };

async function authorized() { return (await getAdminAccess()).status === "authenticated"; }
function refresh() { revalidatePath("/admin/reviews"); revalidatePath("/products/[slug]", "page"); }

export async function moderateReview(id: string, status: ReviewStatus): Promise<ReviewModerationResult> {
  if (!(await authorized())) return { status: "error", message: "Your admin session is not authorized." };
  if (!uuid.test(id) || !["approved", "rejected"].includes(status)) return { status: "error", message: "Invalid review moderation request." };
  const supabase = await createClient(); const { data, error } = await supabase.from("product_reviews").update({ status }).eq("id", id).select("id").maybeSingle();
  if (error || !data) { console.error("Review moderation failed", { code: error?.code ?? "not_found", message: error?.message ?? "Review not found" }); return { status: "error", message: "The review could not be updated." }; }
  refresh(); return { status: "success", message: status === "approved" ? "Review approved." : "Review rejected." };
}

export async function deleteReview(id: string): Promise<ReviewModerationResult> {
  if (!(await authorized())) return { status: "error", message: "Your admin session is not authorized." };
  if (!uuid.test(id)) return { status: "error", message: "Invalid review deletion request." };
  const supabase = await createClient(); const { error } = await supabase.from("product_reviews").delete().eq("id", id);
  if (error) { console.error("Review delete failed", { code: error.code, message: error.message }); return { status: "error", message: "The review could not be deleted." }; }
  refresh(); return { status: "success", message: "Review deleted." };
}
