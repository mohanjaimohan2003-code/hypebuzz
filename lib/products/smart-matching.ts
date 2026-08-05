export type MatchInput = { name: string; brand?: string | null; categoryId?: string | null; specifications?: Record<string, unknown> };
export type MatchCandidate = MatchInput & { id: string; slug: string; imageUrl?: string | null; categoryName?: string | null; merchantIds?: string[] };
export type ProductMatch = { product: MatchCandidate; confidence: number; reasons: string[] };

const merchantNoise = /\b(?:amazon|flipkart|croma|reliance digital|myntra|ajio|official store|best price|online|buy now|with offers?)\b/gi;
const identifierLabels = ["gtin", "ean", "upc", "isbn", "sku", "asin"];
const variantLabels = ["storage", "ram", "memory", "colour", "color", "size", "weight", "variant"];
const stopWords = new Set(["the", "and", "with", "for", "new", "latest", "product"]);

export function normalizeMatchText(value: unknown) {
  const words = String(value ?? "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(merchantNoise, " ").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().split(/\s+/).filter((word) => word && !stopWords.has(word));
  return [...new Set(words)].join(" ").replace(/\b(\d+)\s+(gb|tb|mb|kg|g|inch)\b/g, "$1$2");
}

function normalizedSpecs(specifications: Record<string, unknown> = {}) {
  return Object.fromEntries(Object.entries(specifications).map(([key, value]) => [normalizeMatchText(key), normalizeMatchText(value)]));
}

function readAny(specifications: Record<string, string>, labels: string[]) {
  for (const label of labels) { const value = specifications[normalizeMatchText(label)]; if (value) return value; }
  return "";
}

function tokens(value: string) { return new Set(value.split(" ").filter(Boolean)); }
function similarity(left: string, right: string) {
  const a = tokens(left); const b = tokens(right); if (!a.size || !b.size) return 0;
  const intersection = [...a].filter((word) => b.has(word)).length;
  return intersection / (a.size + b.size - intersection);
}

export function scoreProductMatch(input: MatchInput, candidate: MatchCandidate): ProductMatch {
  const inputName = normalizeMatchText(input.name); const candidateName = normalizeMatchText(candidate.name);
  const inputSpecs = normalizedSpecs(input.specifications); const candidateSpecs = normalizedSpecs(candidate.specifications);
  const identifier = readAny(inputSpecs, identifierLabels); const candidateIdentifier = readAny(candidateSpecs, identifierLabels);
  const reasons: string[] = [];
  if (identifier && candidateIdentifier && identifier === candidateIdentifier) return { product: candidate, confidence: 100, reasons: ["Exact product identifier"] };
  const titleSimilarity = similarity(inputName, candidateName);
  let score = titleSimilarity * 78;
  if (input.brand && candidate.brand && normalizeMatchText(input.brand) === normalizeMatchText(candidate.brand)) { score += 12; reasons.push("Same brand"); }
  else if (input.brand && candidate.brand) score -= 25;
  if (input.categoryId && candidate.categoryId && input.categoryId === candidate.categoryId) { score += 5; reasons.push("Same category"); }
  const model = readAny(inputSpecs, ["model", "model number", "model no"]); const candidateModel = readAny(candidateSpecs, ["model", "model number", "model no"]);
  if (model && candidateModel) { if (model === candidateModel) { score += 15; reasons.push("Same model"); } else score -= 30; }
  for (const label of variantLabels) {
    const value = readAny(inputSpecs, [label]); const candidateValue = readAny(candidateSpecs, [label]);
    if (value && candidateValue) { if (value === candidateValue) { score += 2; reasons.push(`Same ${label}`); } else score -= 12; }
  }
  if (inputName === candidateName) { score = Math.max(score, 95); reasons.push("Normalized title match"); }
  else if (titleSimilarity >= .9) reasons.push("Very similar title");
  return { product: candidate, confidence: Math.max(0, Math.min(100, Math.round(score))), reasons: [...new Set(reasons)] };
}

export function findBestProductMatch(input: MatchInput, candidates: MatchCandidate[]) {
  return candidates.map((candidate) => scoreProductMatch(input, candidate)).sort((a, b) => b.confidence - a.confidence)[0] ?? null;
}
