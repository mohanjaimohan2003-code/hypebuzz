import type { ImportReference, ImportWarning } from "@/lib/admin/product-import/types";
import { normalizeReferenceName } from "@/lib/admin/product-import/match-record";

export const CATEGORY_ALIASES: Record<string, readonly string[]> = {
  sports: ["sports shoes", "running shoes", "walking shoes", "training shoes", "gym shoes", "athletic shoes", "sneakers"],
  mobiles: ["smartphone", "smartphones", "mobile phone", "mobile phones", "android phones", "iphones"],
  laptops: ["notebook", "notebooks", "gaming laptops", "business laptops"],
  audio: ["headphones", "earphones", "earbuds", "speakers", "soundbars"],
  televisions: ["tv", "televisions", "smart tv", "smart televisions"],
  fashion: ["clothing", "shirts", "trousers", "dresses", "footwear", "casual shoes"],
  beauty: ["skincare", "makeup", "face wash", "hair care", "personal care"],
};

export type CategoryImportMatch = {
  id?: string;
  subcategory: string;
  message?: string;
  suggestion?: ImportReference;
  warnings: ImportWarning[];
};

function tokens(value: string) {
  return new Set(normalizeReferenceName(value).split(" ").filter(Boolean));
}

function similarity(left: string, right: string) {
  const a = tokens(left); const b = tokens(right);
  const overlap = [...a].filter((token) => b.has(token)).length;
  return overlap / Math.max(a.size, b.size, 1);
}

function editSimilarity(left: string, right: string) {
  const a = normalizeReferenceName(left); const b = normalizeReferenceName(right);
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let previous = row[0]; row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const old = row[j]; row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1)); previous = old;
    }
  }
  return 1 - row[b.length] / Math.max(a.length, b.length, 1);
}

export function matchImportedCategory(value: string, records: ImportReference[]): CategoryImportMatch {
  const input = value.trim().replace(/\s+/g, " ");
  const active = records.filter((record) => record.isActive);
  const normalized = normalizeReferenceName(input);
  const stages = [
    active.filter((record) => record.slug.toLowerCase() === input.toLowerCase()),
    active.filter((record) => record.name.toLowerCase() === input.toLowerCase()),
    active.filter((record) => normalizeReferenceName(record.name) === normalized || normalizeReferenceName(record.slug) === normalized),
  ];
  for (const matches of stages) {
    if (matches.length === 1) return { id: matches[0].id, subcategory: input, warnings: [] };
    if (matches.length > 1) return { subcategory: input, warnings: [{ field: "category", message: `Category '${input}' matched multiple records. Select one manually.` }] };
  }

  for (const [parent, aliases] of Object.entries(CATEGORY_ALIASES)) {
    if (!aliases.some((alias) => normalizeReferenceName(alias) === normalized)) continue;
    const parents = active.filter((record) => normalizeReferenceName(record.name) === parent || normalizeReferenceName(record.slug) === parent);
    if (parents.length === 1) return { id: parents[0].id, subcategory: input, message: `Category '${input}' was mapped to '${parents[0].name}'.`, warnings: [] };
    if (parents.length > 1) return { subcategory: input, warnings: [{ field: "category", message: `Category '${input}' has multiple possible '${parent}' parents. Select one manually.` }] };
  }

  const ranked = active.map((record) => ({ record, score: Math.max(similarity(input, record.name), similarity(input, record.slug), editSimilarity(input, record.name)) }))
    .sort((a, b) => b.score - a.score || a.record.name.localeCompare(b.record.name));
  const suggestion = ranked[0]?.record;
  return {
    subcategory: input,
    suggestion,
    warnings: [{ field: "category", message: suggestion
      ? `Category '${input}' was not found. Confirm '${suggestion.name}' as the closest existing category or select another category.`
      : `Category '${input}' was not found. Select an existing category; no category was selected automatically.` }],
  };
}
