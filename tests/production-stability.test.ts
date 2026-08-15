import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { safeAffiliateDestination } from "../lib/affiliate/destination";

test("affiliate destinations accept only HTTP and HTTPS", () => {
  assert.equal(safeAffiliateDestination("javascript:alert(1)"), null);
  assert.equal(safeAffiliateDestination("data:text/html,bad"), null);
  assert.equal(safeAffiliateDestination("https://merchant.example/product")?.protocol, "https:");
});

test("affiliate failures are logged while the public route retains its safe fallback", () => {
  const tracking = readFileSync("lib/affiliate/click-tracking.ts", "utf8");
  const route = readFileSync("app/go/[offerId]/route.ts", "utf8");
  assert.match(tracking, /Affiliate offer lookup failed/);
  assert.match(tracking, /Affiliate click tracking failed/);
  assert.match(route, /Affiliate redirect resolution failed/);
  assert.match(route, /\/go\/unavailable/);
});

test("application and root error boundaries provide retry recovery", () => {
  for (const file of ["app/error.tsx", "app/global-error.tsx"]) {
    const source = readFileSync(file, "utf8");
    assert.match(source, /"use client"/);
    assert.match(source, /unstable_retry/);
    assert.match(source, /Try again/);
  }
});

test("production verifier covers migration 029, current image policies, and orphan checks", () => {
  const sql = readFileSync("supabase/verification/verify_production_schema.sql", "utf8");
  assert.match(sql, /save_product_workflow/);
  assert.match(sql, /Public can read complete published product images/);
  assert.match(sql, /13_required_migrations/);
  assert.match(sql, /15_orphans/);
});

test("migration 030 separates public asset reads from admin authorization", () => {
  const sql = readFileSync("supabase/migrations/030_fix_public_asset_read_policies.sql", "utf8");
  assert.match(sql, /can_read_published_product_image_object/);
  assert.match(sql, /can_read_published_knowledge_asset/);
  assert.match(sql, /grant execute[\s\S]*to anon, authenticated/);
  assert.match(sql, /Public can read published knowledge hub items/);
});

test("homepage uses HypeBuzz Picks and the brand link replaces the standalone Home navigation item", () => {
  const catalog = readFileSync("components/home/homepage-catalog.tsx", "utf8");
  const categoryNavigation = readFileSync("components/layout/category-navigation.tsx", "utf8");
  const navbar = readFileSync("components/layout/navbar.tsx", "utf8");
  const homepageData = readFileSync("lib/data/homepage.ts", "utf8");

  assert.match(catalog, /title="HypeBuzz Picks"/);
  assert.match(catalog, /products=\{data\.featuredProducts\}/);
  assert.doesNotMatch(categoryNavigation, />Home<|href="\/">Home/);
  assert.match(navbar, /aria-label="HypeBuzz home"[\s\S]*?href="\/"/);
  assert.match(homepageData, /\.eq\("is_featured", true\)/);
});
