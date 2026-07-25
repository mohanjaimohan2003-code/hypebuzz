import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/validation/product";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; if(!isUuid(id)) return new NextResponse("Not found",{status:404}); const supabase=await createClient();
  const {data:image}=await supabase.from("product_images").select("storage_path").eq("id",id).eq("source_type","upload").maybeSingle<{storage_path:string|null}>();
  if(!image?.storage_path)return new NextResponse("Not found",{status:404}); const result=await supabase.storage.from("product-images").download(image.storage_path); if(result.error)return new NextResponse("Not found",{status:404});
  return new NextResponse(result.data,{headers:{"Content-Type":result.data.type||"application/octet-stream","Cache-Control":"public, max-age=3600, stale-while-revalidate=86400","X-Content-Type-Options":"nosniff"}});
}
