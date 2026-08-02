import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/validation/product";

export async function GET(request:Request) {
  const ids=[...new Set(new URL(request.url).searchParams.get("ids")?.split(",").filter(isUuid)??[])].slice(0,4);
  if(!ids.length) return NextResponse.json({products:[]});
  const supabase=await createClient();
  const result=await supabase.from("products")
    .select("id, name, slug, primary_image_url, specifications, highlights, brand:brands(name), product_offers(current_price, original_price, currency, availability, affiliate_url, is_active, merchant:merchants(name, is_active))")
    .in("id",ids).eq("status","published").not("primary_image_url","is",null).neq("primary_image_url","");
  if(result.error){
    console.error({step:"load products for comparison",code:result.error.code,message:result.error.message,details:result.error.details,hint:result.error.hint});
    return NextResponse.json({message:"Comparison products could not be loaded."},{status:500});
  }
  const byId=new Map((result.data??[]).map(product=>[product.id,product]));
  return NextResponse.json({products:ids.flatMap(id=>byId.has(id)?[byId.get(id)]:[])});
}
