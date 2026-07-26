import type { ImportReference, ImportWarning } from "./types";

export function normalizeReferenceName(value: string) {
  return value.trim().toLowerCase().replace(/[-\s]+/g, " ");
}

export function cleanImportedReferenceDisplayName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function matchImportReference(
  value: string,
  records: ImportReference[],
  kind: "Category" | "Brand" | "Merchant",
): { id: string | undefined; warnings: ImportWarning[] } {
  const input = value.trim();
  const stages = [
    records.filter((record) => record.slug.toLowerCase() === input.toLowerCase()),
    records.filter((record) => record.name.toLowerCase() === input.toLowerCase()),
    records.filter((record) => normalizeReferenceName(record.name) === normalizeReferenceName(input)
      || normalizeReferenceName(record.slug) === normalizeReferenceName(input)),
  ];
  for (const matches of stages) {
    const unique = [...new Map(matches.map((record) => [record.id, record])).values()];
    if (unique.length === 1) return { id: unique[0].id, warnings: [] };
    if (unique.length > 1) return { id: undefined, warnings: [{ field: kind.toLowerCase(), message: `${kind} '${value}' matched multiple records. Select one manually.` }] };
  }
  return { id: undefined, warnings: [{ field: kind.toLowerCase(), message: `${kind} '${value}' was not found. Create it first or select another ${kind.toLowerCase()}.` }] };
}
