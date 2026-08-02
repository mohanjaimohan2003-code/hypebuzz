import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { matchingProductForCreate, nextAvailableProductSlug } from "../lib/products/slug-conflict";

const existing = [
  { id: "1", name: "Acme Phone", slug: "acme-phone", status: "draft" },
  { id: "2", name: "Different Phone", slug: "acme-phone-2", status: "published" },
  { id: "3", name: "Third Phone", slug: "acme-phone-3", status: "draft" },
];

test("a retried create identifies the existing logical product instead of inserting again", () => {
  assert.equal(matchingProductForCreate("  ACME-phone ", existing)?.id, "1");
  assert.equal(matchingProductForCreate("New phone", existing), null);
});

test("a different product receives the first available deterministic slug suffix", () => {
  assert.equal(nextAvailableProductSlug("acme-phone", existing.map((product) => product.slug)), "acme-phone-4");
  assert.equal(nextAvailableProductSlug("new-phone", existing.map((product) => product.slug)), "new-phone");
});

test("the product form guards and disables duplicate submissions", () => {
  const source = readFileSync("components/admin/product-form.tsx", "utf8");
  assert.match(source, /submissionLockRef\.current/);
  assert.match(source, /if \(submissionLockRef\.current\) \{ event\.preventDefault\(\); return; \}/);
  assert.match(source, /disabled=\{isPending \|\| categories\.length === 0 \|\| merchants\.length === 0\}/);
  assert.match(source, /isPending \? "Saving/);
});

test("migration 029 makes product, images, offers, status, and imported brand one transaction", () => {
  const sql = readFileSync("supabase/migrations/029_atomic_product_workflow.sql", "utf8");
  assert.match(sql, /create or replace function public\.save_product_workflow/);
  assert.match(sql, /insert into public\.brands/);
  assert.match(sql, /perform public\.replace_product_images/);
  assert.match(sql, /perform public\.replace_product_offers/);
  assert.match(sql, /update public\.products set status='published'/);
  assert.match(sql, /begin;[\s\S]*commit;/);
});

test("create and edit both call the atomic workflow and compensate staged uploads", () => {
  const source = readFileSync("app/admin/(protected)/products/actions.ts", "utf8");
  assert.equal((source.match(/supabase\.rpc\("save_product_workflow"/g) ?? []).length >= 3, true);
  assert.match(source, /isProductSlugConflict/);
  assert.match(source, /cleanupUploadedImages\(supabase,imageStage\.uploadedPaths/);
  assert.match(source, /stageUpdatedProductImages/);
});
