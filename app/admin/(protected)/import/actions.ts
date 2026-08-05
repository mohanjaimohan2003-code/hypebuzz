"use server";
import { revalidatePath } from "next/cache";
import { getAdminAccess } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { parseCsv } from "@/lib/admin/product-import/csv";
import { findBestProductMatch, normalizeMatchText, type MatchCandidate } from "@/lib/products/smart-matching";
import { createProductSlug } from "@/lib/validation/product";
import type { Json } from "@/lib/types/database";

export type CsvImportState={status:"idle"|"error"|"success";message:string;results:Array<{row:number;product:string;action:"created"|"attached"|"updated"|"review"|"error";detail:string}>};
export const initialCsvImportState:CsvImportState={status:"idle",message:"",results:[]};
const money=(value:string)=>/^\d{1,10}(?:\.\d{1,2})?$/.test(value)?Number(value):null;
const validUrl=(value:string)=>{try{return ["http:","https:"].includes(new URL(value).protocol);}catch{return false;}};
type Ref={id:string;name:string};
type Existing={id:string;name:string;slug:string;category_id:string|null;brand_id:string|null;primary_image_url:string|null;specifications:Json;brand:{name:string}|null;category:{name:string}|null;product_offers:Array<{merchant_id:string}>};

export async function importProductsCsv(_state:CsvImportState,formData:FormData):Promise<CsvImportState>{
  const access=await getAdminAccess();if(access.status!=="authenticated")return{status:"error",message:"Active administrator access is required.",results:[]};
  const csv=String(formData.get("csv")??"");if(csv.length>1_000_000)return{status:"error",message:"CSV must be smaller than 1 MB.",results:[]};
  const rows=parseCsv(csv).slice(0,500);if(!rows.length)return{status:"error",message:"Add a header row and at least one product row.",results:[]};
  const supabase=await createClient();
  const [categoriesResult,brandsResult,merchantsResult]=await Promise.all([supabase.from("categories").select("id,name").eq("is_active",true).returns<Ref[]>(),supabase.from("brands").select("id,name").returns<Ref[]>(),supabase.from("merchants").select("id,name").eq("is_active",true).returns<Ref[]>()]);
  if(categoriesResult.error||brandsResult.error||merchantsResult.error)return{status:"error",message:"Catalog references could not be loaded.",results:[]};
  const byName=(items:Ref[])=>new Map(items.map((item)=>[normalizeMatchText(item.name),item]));const categories=byName(categoriesResult.data??[]),brands=byName(brandsResult.data??[]),merchants=byName(merchantsResult.data??[]);
  const categoryIds=[...new Set(rows.map((row)=>categories.get(normalizeMatchText(row.category))?.id).filter((id):id is string=>Boolean(id)))];
  const existingResult=categoryIds.length?await supabase.from("products").select("id,name,slug,category_id,brand_id,primary_image_url,specifications,brand:brands(name),category:categories(name),product_offers(merchant_id)").in("category_id",categoryIds).neq("status","archived").limit(2000).returns<Existing[]>():{data:[] as Existing[],error:null};
  if(existingResult.error)return{status:"error",message:"Existing products could not be checked safely.",results:[]};
  const results:CsvImportState["results"]=[];
  for(let index=0;index<rows.length;index++){
    const row=rows[index],label=row.product_name||row.name||`Row ${index+2}`;const category=categories.get(normalizeMatchText(row.category)),brand=brands.get(normalizeMatchText(row.brand)),merchant=merchants.get(normalizeMatchText(row.merchant));const price=money(row.current_price||row.price);
    if(!category||!merchant||!label||price===null||!validUrl(row.affiliate_url)){results.push({row:index+2,product:label,action:"error",detail:"Valid product_name, category, merchant, current_price and affiliate_url are required."});continue;}
    const specifications={Model:row.model||"",Storage:row.storage||"",RAM:row.ram||"",Colour:row.colour||row.color||"",Size:row.size||"",Weight:row.weight||"",GTIN:row.gtin||row.ean||row.upc||"",ISBN:row.isbn||"",SKU:row.sku||""};
    const candidates:MatchCandidate[]=(existingResult.data??[]).filter((item)=>item.category_id===category.id&&(!brand||item.brand_id===brand.id)).map((item)=>({id:item.id,name:item.name,slug:item.slug,brand:item.brand?.name,categoryId:item.category_id,categoryName:item.category?.name,imageUrl:item.primary_image_url,specifications:item.specifications&&typeof item.specifications==="object"&&!Array.isArray(item.specifications)?item.specifications as Record<string,unknown>:{},merchantIds:item.product_offers.map((offer)=>offer.merchant_id)}));
    const match=findBestProductMatch({name:label,brand:brand?.name,categoryId:category.id,specifications},candidates);
    const offer={merchant_id:merchant.id,affiliate_url:row.affiliate_url,current_price:price,original_price:money(row.original_price),currency:(row.currency||"INR").toUpperCase(),availability:row.availability||"in_stock",coupon_note:row.coupon||row.coupon_note||null,shipping_note:row.shipping_note||null,offer_title:row.offer_title||null,is_active:true,last_checked_at:new Date().toISOString()};
    if(match&&match.confidence>=95){const existed=match.product.merchantIds?.includes(merchant.id);const saved=await supabase.from("product_offers").upsert({...offer,product_id:match.product.id},{onConflict:"product_id,merchant_id"});results.push({row:index+2,product:label,action:saved.error?"error":existed?"updated":"attached",detail:saved.error?saved.error.message:`${match.confidence}% match: ${match.product.name}`});continue;}
    if(match&&match.confidence>=80){results.push({row:index+2,product:label,action:"review",detail:`${match.confidence}% possible match: ${match.product.name}. Open Add Product for manual confirmation.`});continue;}
    if(!validUrl(row.image_url)){results.push({row:index+2,product:label,action:"error",detail:"A valid image_url is required when creating a new master product."});continue;}
    const id=crypto.randomUUID(),imageId=crypto.randomUUID(),slug=`${createProductSlug(row.slug||label)}-${id.slice(0,8)}`;const product={name:label,slug,short_description:row.short_description||null,description:row.description||null,category_id:category.id,brand_id:brand?.id??null,primary_image_url:row.image_url,specifications,highlights:[],seo_title:null,seo_description:null,is_featured:false,is_trending:false,status:"draft"};
    const created=await supabase.rpc("save_product_workflow",{p_product_id:null,p_product:product as Json,p_images:[{id:imageId,image_url:row.image_url,storage_path:null,source_type:"external",alt_text:label,sort_order:0,is_primary:true}] as unknown as Json,p_offers:[{id:crypto.randomUUID(),...offer}] as unknown as Json});
    if(!created.error&&created.data)(existingResult.data??[]).push({id:String(created.data),name:label,slug,category_id:category.id,brand_id:brand?.id??null,primary_image_url:row.image_url,specifications,brand:brand?{name:brand.name}:null,category:{name:category.name},product_offers:[{merchant_id:merchant.id}]});
    results.push({row:index+2,product:label,action:created.error?"error":"created",detail:created.error?created.error.message:"New draft master product created."});
  }
  revalidatePath("/admin/products");revalidatePath("/");
  const failures=results.filter((result)=>result.action==="error").length,reviews=results.filter((result)=>result.action==="review").length;
  return{status:failures?"error":"success",message:`Processed ${results.length} rows: ${failures} errors, ${reviews} requiring review.`,results};
}
