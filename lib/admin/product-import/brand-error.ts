export type BrandInsertError = { code?: string; message?: string; details?: string; hint?: string };

export function importedBrandProductionError(error: BrandInsertError | null, name: string) {
  if (error?.code === "42501") return "Brand creation was blocked by admin permissions.";
  if (error?.code === "23502" || error?.code === "PGRST204" || error?.code === "42703") {
    return "Brand could not be created because a required database field is missing.";
  }
  if (error?.code === "23514" || error?.code === "22P02") return `Brand '${name}' does not match the database requirements.`;
  return `Brand '${name}' could not be created. Retry or select an existing brand.`;
}
