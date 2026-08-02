"use client";

import { useEffect, useRef, useState } from "react";

export function ReviewForm() {
  const [open, setOpen] = useState(false); const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (open) dialog.current?.showModal(); else dialog.current?.close(); }, [open]);
  return <><button className="inline-flex min-h-10 items-center justify-center rounded-[10px] bg-[#2563EB] px-4 text-sm font-semibold text-white hover:bg-[#1D4ED8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2" onClick={() => setOpen(true)} type="button">Write a Review</button>
    <dialog className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border-0 bg-white p-0 text-[#111827] shadow-2xl backdrop:bg-[#050A14]/60" onCancel={() => setOpen(false)} onClose={() => setOpen(false)} ref={dialog}>
      <div className="p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-bold">Write a Review</h2><p className="mt-2 text-sm leading-6 text-[#4B5563]">Customer review submission is not open yet.</p></div><button aria-label="Close review form" className="rounded-lg px-2 py-1 text-xl text-[#6B7280] hover:bg-[#F3F4F6]" onClick={() => setOpen(false)} type="button">×</button></div>
        <div className="mt-5 rounded-[10px] border border-[#BFDBFE] bg-[#EFF6FF] p-4 text-sm leading-6 text-[#1E3A8A]">HypeBuzz does not currently have public customer accounts. Reviews will be enabled only after secure customer authentication and abuse controls are available. No information entered here is collected.</div>
        <fieldset className="mt-5 space-y-4" disabled><label className="block text-sm font-semibold">Rating *<select className="mt-2 h-11 w-full rounded-[10px] border border-[#D1D5DB] bg-[#F3F4F6] px-3"><option>Select rating</option></select></label><label className="block text-sm font-semibold">Display name<input className="mt-2 h-11 w-full rounded-[10px] border border-[#D1D5DB] bg-[#F3F4F6] px-3" /></label><label className="block text-sm font-semibold">Review title<input className="mt-2 h-11 w-full rounded-[10px] border border-[#D1D5DB] bg-[#F3F4F6] px-3" /></label><label className="block text-sm font-semibold">Review *<textarea className="mt-2 min-h-28 w-full rounded-[10px] border border-[#D1D5DB] bg-[#F3F4F6] p-3" /></label></fieldset>
        <button className="mt-5 min-h-11 w-full rounded-[10px] bg-[#D1D5DB] px-4 text-sm font-semibold text-[#6B7280]" disabled type="button">Submission unavailable</button>
      </div>
    </dialog></>;
}
