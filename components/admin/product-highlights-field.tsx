"use client";

import { MAX_HIGHLIGHTS } from "@/lib/products/rich-fields";

const inputClass = "min-h-11 min-w-0 flex-1 rounded-[10px] border border-[#D1D5DB] bg-white px-3 text-sm outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]";

export function ProductHighlightsField({ values, onChange, disabled, error }: { values: string[]; onChange: (values: string[]) => void; disabled: boolean; error?: string }) {
  function update(index: number, value: string) { onChange(values.map((item, itemIndex) => itemIndex === index ? value : item)); }
  function move(index: number, offset: -1 | 1) {
    const target = index + offset;
    if (target < 0 || target >= values.length) return;
    const next = [...values];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }
  return <div>
    <div className="space-y-3">{values.map((value, index) => <div className="flex flex-col gap-2 sm:flex-row" key={index}><input aria-label={`Highlight ${index + 1}`} className={inputClass} disabled={disabled} maxLength={300} onChange={(event) => update(index, event.target.value)} value={value} /><div className="grid grid-cols-3 gap-2 sm:flex"><button aria-label={`Move highlight ${index + 1} earlier`} className="min-h-11 rounded border px-3" disabled={disabled || index === 0} onClick={() => move(index, -1)} type="button">↑</button><button aria-label={`Move highlight ${index + 1} later`} className="min-h-11 rounded border px-3" disabled={disabled || index === values.length - 1} onClick={() => move(index, 1)} type="button">↓</button><button className="min-h-11 rounded border border-[#FCA5A5] px-3 text-sm font-semibold text-[#B91C1C]" disabled={disabled} onClick={() => onChange(values.filter((_, itemIndex) => itemIndex !== index))} type="button">Remove</button></div></div>)}</div>
    <button className="mt-3 min-h-11 rounded-[10px] border border-[#2563EB] px-4 text-sm font-semibold text-[#1D4ED8]" disabled={disabled || values.length >= MAX_HIGHLIGHTS} onClick={() => onChange([...values, ""])} type="button">Add Highlight</button>
    <p className="mt-2 text-xs text-[#6B7280]">Up to {MAX_HIGHLIGHTS}. Empty and exact duplicate highlights are removed before saving.</p>
    {error ? <p className="mt-2 text-sm font-medium text-[#B91C1C]" role="alert">{error}</p> : null}
  </div>;
}
