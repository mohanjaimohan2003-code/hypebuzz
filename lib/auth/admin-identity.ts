export type AdminIdentityRow = { user_id: string; role: string; is_active: boolean };

export function assessAdminIdentity(input: {
  userId: string | null;
  authFailed: boolean;
  admin: AdminIdentityRow | null;
  adminLookupFailed: boolean;
}) {
  if (input.authFailed || !input.userId) return { allowed: false as const, message: "Your admin session is missing or expired. Please sign in again." };
  if (input.adminLookupFailed) return { allowed: false as const, message: "Your admin account could not be verified. Please sign in again." };
  if (!input.admin || input.admin.user_id !== input.userId || input.admin.role !== "admin" || input.admin.is_active !== true) {
    return { allowed: false as const, message: "Your account is not an active HypeBuzz administrator." };
  }
  return { allowed: true as const, message: "" };
}
