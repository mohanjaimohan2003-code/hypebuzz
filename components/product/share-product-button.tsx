"use client";

import { useState } from "react";

type ShareProductButtonProps = {
  title: string;
  text: string;
  url: string;
};

export function ShareProductButton({ title, text, url }: ShareProductButtonProps) {
  const [feedback, setFeedback] = useState("");

  async function copyLink() {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      } else {
        const input = document.createElement("textarea");
        input.value = url;
        input.style.position = "fixed";
        input.style.opacity = "0";
        document.body.appendChild(input);
        input.select();
        const copied = document.execCommand("copy");
        input.remove();
        if (!copied) throw new Error("Copy command was rejected");
      }
      setFeedback("Link copied");
    } catch {
      setFeedback("Could not copy link");
    }
  }

  async function shareProduct() {
    setFeedback("");
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    await copyLink();
  }

  return (
    <div className="mt-4 flex items-center gap-3">
      <button
        className="inline-flex min-h-10 items-center gap-2 rounded-[10px] border border-[#D1D5DB] bg-white px-4 text-sm font-semibold text-[#374151] transition-colors hover:border-[#2563EB] hover:bg-[#EFF6FF] hover:text-[#1D4ED8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 motion-reduce:transition-none"
        onClick={shareProduct}
        type="button"
      >
        <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
          <path d="M12 16V3m0 0L7 8m5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </svg>
        Share product
      </button>
      <span aria-live="polite" className="text-sm font-medium text-[#166534]" role="status">{feedback}</span>
    </div>
  );
}
