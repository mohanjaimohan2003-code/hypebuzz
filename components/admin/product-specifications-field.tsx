"use client";

import { MAX_SPECIFICATIONS } from "@/lib/products/rich-fields";

export type SpecificationRow = { id: string; label: string; value: string };
const inputClass = "min-h-11 min-w-0 rounded-[10px] border border-[#D1D5DB] bg-white px-3 text-sm outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]";

export function specificationsToRows(specifications: Record<string, string>): SpecificationRow[] {
  return Object.entries(specifications).map(([label, value], index) => ({ id: `spec-${index}-${label}`, label, value }));
}

export function ProductSpecificationsField({ rows, onChange, disabled, error }: { rows: SpecificationRow[]; onChange: (rows: SpecificationRow[]) => void; disabled: boolean; error?: string }) {
  const update = (id: string, field: "label" | "value", value: string) => onChange(rows.map((row) => row.id === id ? { ...row, [field]: value } : row));
  return <div>
    <div className="space-y-3">{rows.map((row, index) => <div className="grid gap-2 sm:grid-cols-[minmax(0,0.7fr)_minmax(0,1fr)_auto]" key={row.id}><input aria-label={`Specification ${index + 1} label`} className={inputClass} disabled={disabled} maxLength={100} onChange={(event) => update(row.id, "label", event.target.value)} placeholder="Label" value={row.label} /><input aria-label={`Specification ${index + 1} value`} className={inputClass} disabled={disabled} maxLength={500} onChange={(event) => update(row.id, "value", event.target.value)} placeholder="Value" value={row.value} /><button className="min-h-11 rounded border border-[#FCA5A5] px-3 text-sm font-semibold text-[#B91C1C]" disabled={disabled} onClick={() => onChange(rows.filter((item) => item.id !== row.id))} type="button">Remove</button></div>)}</div>
    <button className="mt-3 min-h-11 rounded-[10px] border border-[#2563EB] px-4 text-sm font-semibold text-[#1D4ED8]" disabled={disabled || rows.length >= MAX_SPECIFICATIONS} onClick={() => onChange([...rows, { id: crypto.randomUUID(), label: "", value: "" }])} type="button">Add Specification</button>
    <p className="mt-2 text-xs text-[#6B7280]">Up to {MAX_SPECIFICATIONS}. Empty rows are ignored; labels must be unique.</p>
    {error ? <p className="mt-2 text-sm font-medium text-[#B91C1C]" role="alert">{error}</p> : null}
  </div>;
}
