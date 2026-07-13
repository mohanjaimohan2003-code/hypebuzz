"use client";

import { useFormStatus } from "react-dom";
import { signOutAdmin } from "@/app/admin/(protected)/actions";
import { AdminIcon } from "./admin-icon";

type AdminSignOutButtonProps = {
  variant?: "sidebar" | "topbar";
};

function SignOutSubmitButton({ variant }: Required<AdminSignOutButtonProps>) {
  const { pending } = useFormStatus();
  const isSidebar = variant === "sidebar";

  return (
    <button
      aria-label={pending ? "Signing out" : "Sign out"}
      className={`flex min-h-11 items-center justify-center gap-2 rounded-[10px] px-3.5 py-2.5 text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA] focus-visible:ring-offset-2 disabled:cursor-wait motion-reduce:transition-none ${
        isSidebar
          ? "w-full text-[#D1D5DB] hover:bg-white/10 hover:text-white focus-visible:ring-offset-[#050A14] disabled:text-[#9CA3AF]"
          : "border border-[#E5E7EB] bg-white text-[#111827] hover:border-[#2563EB] hover:bg-[#EFF6FF] hover:text-[#1D4ED8] focus-visible:ring-offset-white disabled:bg-[#F8FAFC] disabled:text-[#6B7280]"
      }`}
      disabled={pending}
      type="submit"
    >
      <AdminIcon className="h-5 w-5" name="sign-out" />
      <span>{pending ? "Signing out..." : "Sign Out"}</span>
    </button>
  );
}

export function AdminSignOutButton({
  variant = "topbar",
}: AdminSignOutButtonProps) {
  return (
    <form action={signOutAdmin}>
      <SignOutSubmitButton variant={variant} />
    </form>
  );
}
