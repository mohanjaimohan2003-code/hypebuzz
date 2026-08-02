"use client";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { COMPARE_CHANGE_EVENT, COMPARE_STORAGE_KEY, MAX_COMPARE_PRODUCTS, parseCompareSelection } from "@/lib/compare/selection";
type Props = { productName: string; initiallyWishlisted?: boolean };
const focus = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2";
function Heart({ filled }: { filled: boolean }) { return <svg aria-hidden="true" className="h-5 w-5" fill={filled ? "currentColor" : "none"} viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z" stroke="currentColor" strokeWidth="2" /></svg>; }
export function WishlistButton({ productName, initiallyWishlisted = false }: Props) { const [saved, setSaved] = useState(initiallyWishlisted); return <button aria-label={`${saved ? "Remove" : "Add"} ${productName} ${saved ? "from" : "to"} wishlist`} aria-pressed={saved} className={`flex h-11 w-11 items-center justify-center rounded-[10px] border bg-white shadow-sm transition-colors duration-150 motion-reduce:transition-none ${focus} ${saved ? "border-[#2563EB] text-[#2563EB]" : "border-[#E5E7EB] text-[#111827] hover:border-[#2563EB] hover:bg-[#EFF6FF]"}`} onClick={() => setSaved(!saved)} type="button"><Heart filled={saved} /></button>; }
export function CompareButton({ productId, productName }: {productId:string;productName:string}) {
  const serialized=useSyncExternalStore((notify)=>{window.addEventListener("storage",notify);window.addEventListener(COMPARE_CHANGE_EVENT,notify);return()=>{window.removeEventListener("storage",notify);window.removeEventListener(COMPARE_CHANGE_EVENT,notify);};},()=>localStorage.getItem(COMPARE_STORAGE_KEY)??"[]",()=>"[]");
  const selection=parseCompareSelection(serialized);
  const added=selection.includes(productId);
  function toggle(){
    const current=parseCompareSelection(localStorage.getItem(COMPARE_STORAGE_KEY));
    const next=current.includes(productId)?current.filter(id=>id!==productId):current.length<MAX_COMPARE_PRODUCTS?[...current,productId]:current;
    localStorage.setItem(COMPARE_STORAGE_KEY,JSON.stringify(next));
    window.dispatchEvent(new Event(COMPARE_CHANGE_EVENT));
  }
  const full=!added&&selection.length>=MAX_COMPARE_PRODUCTS;
  return <div className="grid grid-cols-2 gap-2">
    <button aria-label={`${added ? "Remove" : "Add"} ${productName} ${added ? "from" : "to"} comparison`} aria-pressed={added} className={`flex min-h-10 items-center justify-center rounded-[9px] border px-2 text-xs font-semibold transition-colors ${focus} ${added ? "border-[#2563EB] bg-[#EFF6FF] text-[#1D4ED8]" : "border-[#E5E7EB] bg-white text-[#111827] hover:bg-[#EFF6FF]"}`} disabled={full} onClick={toggle} title={full?`Compare up to ${MAX_COMPARE_PRODUCTS} products`:undefined} type="button">{added?"Remove":"Compare"}</button>
    <Link className={`flex min-h-10 items-center justify-center rounded-[9px] border border-[#2563EB] px-2 text-xs font-bold text-[#1D4ED8] hover:bg-[#2563EB] hover:text-white ${focus}`} href="/compare">View ({selection.length})</Link>
  </div>;
}
