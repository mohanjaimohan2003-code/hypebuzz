"use client";

import Image from "next/image";
import type { MouseEvent } from "react";
import { useEffect, useState } from "react";

type ShareProductButtonProps = {
  ariaLabel?: string;
  title: string;
  text?: string;
  url: string;
};

export function ShareProductButton({ ariaLabel = "Share product", title, text, url }: ShareProductButtonProps) {
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(""), 2500);
    return () => window.clearTimeout(timer);
  }, [feedback]);

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

  async function shareProduct(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    setFeedback("");
    if (navigator.share) {
      try {
        await navigator.share({ title, ...(text ? { text } : {}), url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    await copyLink();
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        aria-label={ariaLabel}
        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#D1D5DB] bg-white/95 text-[#374151] shadow-sm backdrop-blur-sm transition-colors hover:border-[#2563EB] hover:bg-[#EFF6FF] hover:text-[#1D4ED8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 motion-reduce:transition-none"
        onClick={shareProduct}
        type="button"
      >
        <Image alt="" aria-hidden="true" className="h-[18px] w-[18px] object-contain" height={18} src="/icons/share.png" width={18} />
      </button>
      <span aria-live="polite" className={feedback ? "rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-[#166534] shadow-sm" : "sr-only"} role="status">{feedback}</span>
    </div>
  );
}
