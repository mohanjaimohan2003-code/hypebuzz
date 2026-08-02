import type {Metadata} from "next";
import {ComparePageClient} from "@/components/compare/compare-page-client";
import {Footer} from "@/components/layout/footer";
import {HomepageHeader} from "@/components/layout/homepage-header";

export const metadata:Metadata={title:"Compare Products | HypeBuzz",description:"Compare product specifications, prices, and merchant offers side by side."};
export default function ComparePage(){return <><HomepageHeader/><main className="min-h-screen bg-[#F8FAFC]" id="main-content"><div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10"><header className="mb-8"><p className="text-sm font-semibold text-[#2563EB]">Product comparison</p><h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Compare Products</h1><p className="mt-3 max-w-2xl text-[#4B5563]">Compare up to four products across specifications, current prices, and active merchant offers.</p></header><ComparePageClient/></div></main><Footer/></>}
