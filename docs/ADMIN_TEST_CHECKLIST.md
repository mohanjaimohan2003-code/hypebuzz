# Admin test checklist

Use a staging Supabase project with the production migration set. Record the tester, date, browser, viewport, result, and any Supabase error code for each item.

- [ ] Sign in with an active admin; verify `/admin` loads.
- [ ] Sign in with a valid non-admin; verify access is denied.
- [ ] Add a category; verify it appears in the alphabetized Add Product dropdown after navigation.
- [ ] Edit the category name/slug/details.
- [ ] Try a duplicate category slug; verify the slug error is clear.
- [ ] Deactivate the category; verify it leaves the new-product dropdown but remains manageable.
- [ ] Reactivate the category.
- [ ] Add and edit a brand; verify it appears in the product brand selector.
- [ ] Try a duplicate brand slug.
- [ ] Add and edit a merchant, then deactivate/reactivate it.
- [ ] Create a draft product without images or offers.
- [ ] Create a draft product with one JPG, PNG, or WebP image.
- [ ] Create a product with multiple images; reorder them and select a primary image.
- [ ] Reject a ninth image, a file over 5 MB, and a disguised/non-image file.
- [ ] On a phone, select from gallery and capture from the rear camera.
- [ ] Create a product with one valid active offer and affiliate HTTP(S) link.
- [ ] Create a product with multiple merchants/offers.
- [ ] Reject duplicate merchants within one product.
- [ ] Publish a product with an eligible active offer.
- [ ] Reject publication without an eligible offer.
- [ ] Edit product name, category, brand, images, and offers; verify persisted values.
- [ ] Publish and unpublish (save as draft) a product.
- [ ] Archive a product and verify no database row is deleted.
- [ ] Try blank name/category, malformed slug/URL/currency, zero price, and original price below current price.
- [ ] Try a duplicate product slug; verify “This product slug already exists” semantics.
- [ ] Deactivate a selected brand/merchant in another session; verify the stale selection is rejected clearly.
- [ ] Verify signed/private product images display in admin and on a published public product.
- [ ] Test at 360×800 and 390×844: navigation drawer, inputs, file picker, offer cards, errors, and submit buttons remain usable without horizontal scrolling.
- [ ] Check server logs contain Supabase code/message/details/hint but no keys, tokens, passwords, or cookies.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
