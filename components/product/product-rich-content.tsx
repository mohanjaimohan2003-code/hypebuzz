export function ProductHighlights({ highlights }: { highlights: string[] }) {
  if (!highlights.length) return null;
  return <section aria-labelledby="highlights-heading" className="mt-6"><h2 className="text-lg font-bold text-[#111827]" id="highlights-heading">Highlights</h2><ul className="mt-3 space-y-2">{highlights.map((highlight) => <li className="flex gap-3 text-sm leading-6 text-[#374151]" key={highlight}><span aria-hidden="true" className="font-bold text-[#2563EB]">✓</span><span>{highlight}</span></li>)}</ul></section>;
}

export function ProductRichDetails({ description, specifications }: { description: string | null; specifications: Array<{ name: string; value: string }> }) {
  if (!description && !specifications.length) return null;
  return <div className="space-y-10">
    <ProductDescription description={description} />
    <ProductSpecifications specifications={specifications} />
  </div>;
}

export function ProductDescription({ description }: { description: string | null }) { return description ? <section aria-labelledby="description-heading"><h2 className="text-2xl font-bold text-[#111827]" id="description-heading">About this product</h2><div className="mt-4 max-w-[720px] whitespace-pre-line leading-7 text-[#4B5563]">{description}</div></section> : null; }
export function ProductSpecifications({ specifications }: { specifications: Array<{ name: string; value: string }> }) { return specifications.length ? <section aria-labelledby="specifications-heading"><h2 className="text-2xl font-bold text-[#111827]" id="specifications-heading">Specifications</h2><dl className="mt-4 overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white">{specifications.map((specification, index) => <div className={`grid gap-1 p-4 sm:grid-cols-[minmax(8rem,0.4fr)_1fr] sm:gap-4 ${index ? "border-t border-[#E5E7EB]" : ""}`} key={specification.name}><dt className="font-medium text-[#6B7280]">{specification.name}</dt><dd className="break-words text-[#111827]">{specification.value}</dd></div>)}</dl></section> : null; }
