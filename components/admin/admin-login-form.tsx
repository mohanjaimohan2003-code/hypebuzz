"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

export function AdminLoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMessage("Invalid email or password. Please try again.");
        return;
      }

      router.replace("/admin");
      router.refresh();
    } catch {
      setErrorMessage("Unable to sign in right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form aria-busy={isLoading} className="mt-8 space-y-5" onSubmit={handleSubmit}>
      <div>
        <label className="block text-sm font-semibold text-[#111827]" htmlFor="admin-email">
          Email address
        </label>
        <input autoComplete="email" className="mt-2 h-12 w-full rounded-[10px] border border-[#D1D5DB] bg-white px-4 text-[#111827] outline-none transition-colors placeholder:text-[#6B7280] hover:border-[#9CA3AF] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2" disabled={isLoading} id="admin-email" name="email" required type="email" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-[#111827]" htmlFor="admin-password">
          Password
        </label>
        <input autoComplete="current-password" className="mt-2 h-12 w-full rounded-[10px] border border-[#D1D5DB] bg-white px-4 text-[#111827] outline-none transition-colors hover:border-[#9CA3AF] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2" disabled={isLoading} id="admin-password" name="password" required type="password" />
      </div>
      {errorMessage ? (
        <p aria-live="polite" className="rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-[#B91C1C]" role="alert">
          {errorMessage}
        </p>
      ) : null}
      <button className="flex h-12 w-full items-center justify-center rounded-[10px] bg-[#2563EB] px-5 font-semibold text-white transition-colors hover:bg-[#1D4ED8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[#93C5FD]" disabled={isLoading} type="submit">
        {isLoading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
