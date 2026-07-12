import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin | HypeBuzz" };

export default function AdminPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050A14] px-4 py-12">
      <section className="w-full max-w-2xl rounded-2xl border border-white/10 bg-white p-8 text-center shadow-2xl">
        <p className="text-sm font-semibold text-[#2563EB]">Secure administrator area</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#111827] sm:text-4xl">
          HypeBuzz Admin Dashboard Coming Soon
        </h1>
      </section>
    </main>
  );
}
