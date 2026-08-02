import assert from "node:assert/strict";
import test from "node:test";
import {MAX_COMPARE_PRODUCTS,parseCompareSelection} from "../lib/compare/selection";

const ids=[
  "11111111-1111-4111-8111-111111111111",
  "22222222-2222-4222-8222-222222222222",
  "33333333-3333-4333-8333-333333333333",
  "44444444-4444-4444-8444-444444444444",
  "55555555-5555-4555-8555-555555555555",
];

test("comparison selection survives serialized browser storage",()=>{
  assert.deepEqual(parseCompareSelection(JSON.stringify(ids.slice(0,3))),ids.slice(0,3));
});

test("comparison selection removes duplicates, invalid values, and enforces the limit",()=>{
  const parsed=parseCompareSelection(JSON.stringify([ids[0],"invalid",...ids,ids[0]]));
  assert.equal(parsed.length,MAX_COMPARE_PRODUCTS);
  assert.deepEqual(parsed,ids.slice(0,MAX_COMPARE_PRODUCTS));
});

test("corrupt comparison storage safely produces an empty selection",()=>{
  assert.deepEqual(parseCompareSelection("not-json"),[]);
  assert.deepEqual(parseCompareSelection(JSON.stringify({id:ids[0]})),[]);
});
