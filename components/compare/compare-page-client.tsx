"use client";

/* eslint-disable @next/next/no-img-element -- product images may use approved external hosts. */
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { COMPARE_CHANGE_EVENT, COMPARE_STORAGE_KEY, parseCompareSelection } from "@/lib/compare/selection";

type Offer={current_price:number;original_price:number|null;currency:string;availability:string|null;affiliate_url:string;is_active:boolean;merchant:{name:string;is_active:boolean}|null};
type Product={id:string;name:string;slug:string;primary_image_url:string;specifications:Record<string,unknown>;highlights:unknown;brand:{name:string}|null;product_offers:Offer[]};

function money(value:number,currency:string){return new Intl.NumberFormat("en-IN",{style:"currency",currency,maximumFractionDigits:0}).format(value);}
function validOffers(product:Product){return product.product_offers.filter(offer=>offer.is_active&&offer.merchant?.is_active&&Number(offer.current_price)>0&&/^https?:\/\//i.test(offer.affiliate_url));}

export function ComparePageClient(){
  const [ids,setIds]=useState<string[]>([]); const [products,setProducts]=useState<Product[]>([]); const [loading,setLoading]=useState(true); const [error,setError]=useState("");
  const load=useCallback(async()=>{
    const next=parseCompareSelection(localStorage.getItem(COMPARE_STORAGE_KEY)); setIds(next); setError("");
    if(!next.length){setProducts([]);setLoading(false);return;}
    setLoading(true);
    try{const response=await fetch(`/api/compare?ids=${encodeURIComponent(next.join(","))}`,{cache:"no-store"});if(!response.ok)throw new Error();const body=await response.json() as {products:Product[]};setProducts(body.products);}
    catch{setError("Comparison products could not be loaded. Please try again.");}
    finally{setLoading(false);}
  },[]);
  useEffect(()=>{queueMicrotask(()=>void load());window.addEventListener(COMPARE_CHANGE_EVENT,load);window.addEventListener("storage",load);return()=>{window.removeEventListener(COMPARE_CHANGE_EVENT,load);window.removeEventListener("storage",load);};},[load]);
  function remove(id:string){localStorage.setItem(COMPARE_STORAGE_KEY,JSON.stringify(ids.filter(value=>value!==id)));window.dispatchEvent(new Event(COMPARE_CHANGE_EVENT));}
  function clear(){localStorage.removeItem(COMPARE_STORAGE_KEY);window.dispatchEvent(new Event(COMPARE_CHANGE_EVENT));}
  const specificationNames=useMemo(()=>[...new Set(products.flatMap(product=>Object.keys(product.specifications??{})))],[products]);
  if(loading)return <p className="rounded-2xl border bg-white p-8 text-[#4B5563]">Loading comparison…</p>;
  if(error)return <div className="rounded-2xl border border-[#FCA5A5] bg-[#FEF2F2] p-6 text-[#991B1B]" role="alert">{error}</div>;
  if(!products.length)return <div className="rounded-2xl border border-dashed border-[#CBD5E1] bg-white p-10 text-center"><h2 className="text-xl font-bold">No products selected</h2><p className="mt-2 text-sm text-[#6B7280]">Choose Compare on up to four product cards, then return here.</p><Link className="mt-6 inline-flex min-h-11 items-center rounded-[10px] bg-[#2563EB] px-5 text-sm font-bold text-white" href="/search">Browse products</Link></div>;
  return <div className="space-y-6">
    <div className="flex justify-end"><button className="min-h-10 rounded-[9px] border border-[#D1D5DB] bg-white px-4 text-sm font-semibold" onClick={clear} type="button">Clear comparison</button></div>
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">{products.map(product=>{const offers=validOffers(product);const cheapest=[...offers].sort((a,b)=>Number(a.current_price)-Number(b.current_price))[0];return <article className="flex h-full flex-col rounded-2xl border border-[#E5E7EB] bg-white p-4" key={product.id}><div className="aspect-[16/10] overflow-hidden rounded-xl bg-[#F8FAFC]"><img alt={product.name} className="h-full w-full object-contain p-3" src={product.primary_image_url}/></div><p className="mt-4 text-xs text-[#6B7280]">{product.brand?.name??"Independent brand"}</p><h2 className="mt-1 min-h-12 font-bold leading-6">{product.name}</h2><p className="mt-3 text-lg font-bold text-[#1455E8]">{cheapest?money(Number(cheapest.current_price),cheapest.currency):"Price unavailable"}</p><p className="text-xs text-[#6B7280]">{offers.length} active {offers.length===1?"offer":"offers"}</p><div className="mt-auto grid grid-cols-2 gap-2 pt-4"><Link className="flex min-h-10 items-center justify-center rounded-[9px] bg-[#2563EB] px-2 text-xs font-bold text-white" href={`/products/${product.slug}`}>View product</Link><button className="min-h-10 rounded-[9px] border border-[#D1D5DB] px-2 text-xs font-semibold" onClick={()=>remove(product.id)} type="button">Remove</button></div></article>;})}</div>
    <section className="overflow-x-auto rounded-2xl border border-[#E5E7EB] bg-white" aria-labelledby="specification-comparison"><h2 className="p-5 text-xl font-bold" id="specification-comparison">Specifications</h2><table className="w-full min-w-[44rem] border-collapse text-left text-sm"><thead><tr className="border-t bg-[#F8FAFC]"><th className="p-4">Specification</th>{products.map(product=><th className="p-4" key={product.id}>{product.name}</th>)}</tr></thead><tbody className="divide-y">{specificationNames.length?specificationNames.map(name=><tr key={name}><th className="p-4 font-semibold">{name}</th>{products.map(product=><td className="p-4 text-[#4B5563]" key={product.id}>{String(product.specifications?.[name]??"—")}</td>)}</tr>):<tr><td className="p-5 text-[#6B7280]" colSpan={products.length+1}>No structured specifications are available for these products.</td></tr>}</tbody></table></section>
    <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4" aria-label="Price and offer comparison">{products.map(product=><article className="rounded-2xl border border-[#E5E7EB] bg-white p-5" key={product.id}><h2 className="font-bold">{product.name}</h2><ul className="mt-4 space-y-3">{validOffers(product).map((offer,index)=><li className="rounded-xl bg-[#F8FAFC] p-3" key={`${offer.merchant?.name}-${index}`}><div className="flex items-center justify-between gap-3"><span className="text-sm font-semibold">{offer.merchant?.name}</span><span className="font-bold text-[#1455E8]">{money(Number(offer.current_price),offer.currency)}</span></div><p className="mt-1 text-xs capitalize text-[#6B7280]">{offer.availability?.replaceAll("_"," ")??"Availability unknown"}</p></li>)}</ul></article>)}</section>
  </div>;
}
