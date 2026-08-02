import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ReviewCard } from "../components/product/review-card";
import { ProductReviews } from "../components/product/product-reviews";
import { calculateReviewSummary, filterSortPaginateReviews, type ProductReview } from "../lib/reviews/model";
import { validateReviewSubmission } from "../lib/validation/review";

const base: ProductReview = { id:"1",product_id:"p",user_id:null,reviewer_name:"Rajesh Kumar",rating:5,title:"Excellent",review_text:"Comfortable shoes.",is_verified_buyer:false,status:"approved",helpful_count:0,unhelpful_count:0,created_at:"2026-07-01T00:00:00Z",updated_at:"2026-07-01T00:00:00Z" };

test("rating and text validation reject malformed or whitespace-only input",()=>{
  const invalid=validateReviewSubmission({rating:6,reviewerName:"  ",title:"x".repeat(121),reviewText:" \n "});
  assert.equal(invalid.success,false); if(!invalid.success) assert.deepEqual(Object.keys(invalid.errors).sort(),["rating","reviewText","reviewerName","title"]);
  const valid=validateReviewSubmission({rating:"4",reviewerName:"  Asha  ",title:"  Useful ",reviewText:"  Clear review.  "});
  assert.deepEqual(valid,{success:true,data:{rating:4,reviewerName:"Asha",title:"Useful",reviewText:"Clear review."}});
});

test("only approved reviews contribute to public summary and distribution",()=>{
  const summary=calculateReviewSummary([{rating:5,status:"approved"},{rating:4,status:"approved"},{rating:1,status:"pending"},{rating:2,status:"rejected"}]);
  assert.equal(summary.totalReviews,2); assert.equal(summary.averageRating,4.5); assert.deepEqual(summary.counts,{1:0,2:0,3:0,4:1,5:1});
});

test("zero-review summary has no fabricated average",()=>{ assert.deepEqual(calculateReviewSummary([]),{totalReviews:0,averageRating:null,counts:{1:0,2:0,3:0,4:0,5:0}}); });

test("zero reviews still render the complete public empty state",()=>{
  const html=renderToStaticMarkup(createElement(ProductReviews,{slug:"test-product",summary:calculateReviewSummary([]),reviews:[],rating:"all",sort:"recent",limit:5,hasMore:false,hasError:false}));
  assert.match(html,/Customer Reviews/); assert.match(html,/No reviews yet\./); assert.match(html,/Be the first to share your experience with this product\./); assert.match(html,/Write a Review/);
});

test("database failures remain visible without hiding Customer Reviews",()=>{
  const html=renderToStaticMarkup(createElement(ProductReviews,{slug:"test-product",summary:calculateReviewSummary([]),reviews:[],rating:"all",sort:"recent",limit:5,hasMore:false,hasError:true}));
  assert.match(html,/Customer Reviews/); assert.match(html,/Reviews are temporarily unavailable/); assert.doesNotMatch(html,/No reviews yet/);
});

test("public filtering, sorting, and pagination exclude pending and rejected reviews",()=>{
  const rows:ProductReview[]=[{...base,id:"5",rating:5,created_at:"2026-01-01T00:00:00Z"},{...base,id:"4",rating:4,created_at:"2026-03-01T00:00:00Z"},{...base,id:"1",status:"pending"},{...base,id:"2",status:"rejected"},{...base,id:"3",rating:4,created_at:"2026-02-01T00:00:00Z"}];
  assert.deepEqual(filterSortPaginateReviews(rows,"all","recent",2).reviews.map(r=>r.id),["4","3"]);
  assert.deepEqual(filterSortPaginateReviews(rows,4,"highest",5).reviews.map(r=>r.id),["4","3"]);
  assert.deepEqual(filterSortPaginateReviews(rows,"all","lowest",5).reviews.map(r=>r.id),["4","3","5"]);
  assert.equal(filterSortPaginateReviews(rows,"all","recent",2).hasMore,true);
});

test("Verified Buyer badge renders only from the genuine database flag",()=>{
  assert.doesNotMatch(renderToStaticMarkup(createElement(ReviewCard,{review:base})),/Verified Buyer/);
  assert.match(renderToStaticMarkup(createElement(ReviewCard,{review:{...base,is_verified_buyer:true}})),/Verified Buyer/);
});

test("migration enforces approved-only public reads, hides user ids, and grants no public writes",()=>{
  const sql=readFileSync("supabase/migrations/031_product_reviews.sql","utf8");
  assert.match(sql,/Public can read approved product reviews[\s\S]*status='approved'/);
  assert.match(sql,/grant select\(id, product_id, reviewer_name/);
  assert.doesNotMatch(sql,/grant select\([^;]*user_id/);
  assert.doesNotMatch(sql,/grant insert[\s\S]*to anon/);
  assert.doesNotMatch(sql,/for (insert|update|delete) to anon/);
});

test("admin moderation verifies application authorization and active-admin RLS",()=>{
  const action=readFileSync("app/admin/(protected)/reviews/actions.ts","utf8"); const sql=readFileSync("supabase/migrations/031_product_reviews.sql","utf8");
  assert.match(action,/getAdminAccess/); assert.match(action,/\["approved", "rejected"\]/);
  assert.match(sql,/Active admins can moderate product reviews[\s\S]*auth\.uid\(\)[\s\S]*is_active/);
  assert.match(sql,/Active admins can delete product reviews/);
});
