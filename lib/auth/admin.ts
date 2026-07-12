import "server-only";

import { createClient } from "@/lib/supabase/server";

export type AdminAccess =
  | { status: "authenticated"; userId: string }
  | { status: "unauthenticated" }
  | { status: "denied" };

export async function getAdminAccess(): Promise<AdminAccess> {
  try {
    const supabase = await createClient();
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims();
    const userId = claimsData?.claims?.sub;

    if (claimsError || !userId) return { status: "unauthenticated" };

    const { data: admin, error: adminError } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", userId)
      .eq("role", "admin")
      .eq("is_active", true)
      .maybeSingle();

    if (adminError || !admin) return { status: "denied" };

    return { status: "authenticated", userId };
  } catch {
    return { status: "denied" };
  }
}
