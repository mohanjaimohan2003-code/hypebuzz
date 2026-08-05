import assert from "node:assert/strict";
import test from "node:test";
import { findBestProductMatch, normalizeMatchText, scoreProductMatch } from "../lib/products/smart-matching";
import { parseCsv } from "../lib/admin/product-import/csv";

test("normalization removes merchant noise, punctuation, spacing, and duplicate words", () => {
  assert.equal(normalizeMatchText(" Samsung  Galaxy S25 S25 256GB - Amazon Official Store "), "samsung galaxy s25 256gb");
});

test("exact identifiers produce a 100 percent match", () => {
  const match = scoreProductMatch({ name: "Different listing", specifications: { EAN: "8901234567890" } }, { id: "1", slug: "master", name: "Master", specifications: { ean: "8901234567890" } });
  assert.equal(match.confidence, 100);
});

test("same model and variant recommend the master while different storage is penalized", () => {
  const master = { id: "1", slug: "samsung-galaxy-s25-256gb", name: "Samsung Galaxy S25 256GB", brand: "Samsung", categoryId: "mobiles", specifications: { Model: "SM-S931B", Storage: "256 GB", RAM: "12 GB" } };
  const same = scoreProductMatch({ name: "Samsung Galaxy S25 256 GB Flipkart", brand: "Samsung", categoryId: "mobiles", specifications: { Model: "SM-S931B", Storage: "256GB", RAM: "12GB" } }, master);
  const different = scoreProductMatch({ name: "Samsung Galaxy S25 128GB", brand: "Samsung", categoryId: "mobiles", specifications: { Model: "SM-S931B", Storage: "128GB", RAM: "12GB" } }, master);
  assert.ok(same.confidence >= 95);
  assert.ok(different.confidence < same.confidence);
});

test("best candidate selection is deterministic", () => {
  const candidates = [{ id: "a", slug: "other", name: "Apple iPhone 16", brand: "Apple" }, { id: "b", slug: "s25", name: "Samsung Galaxy S25 256GB", brand: "Samsung" }];
  assert.equal(findBestProductMatch({ name: "Samsung Galaxy S25 256GB", brand: "Samsung" }, candidates)?.product.id, "b");
});

test("CSV parser handles quoted commas and normalized headings", () => {
  const rows=parseCsv('Product Name,Merchant,Current Price\n"Phone, Pro",Amazon,74999');
  assert.deepEqual(rows,[{product_name:"Phone, Pro",merchant:"Amazon",current_price:"74999"}]);
});
