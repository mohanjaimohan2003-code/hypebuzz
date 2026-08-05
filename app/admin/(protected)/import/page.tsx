import type { Metadata } from "next";
import { ProductCsvImporter } from "@/components/admin/product-csv-importer";
export const metadata:Metadata={title:"CSV Import | HypeBuzz Admin"};
export default function AdminImportPage(){return <div><header><p className="text-sm font-semibold text-[#7C3AED]">Smart catalog matching</p><h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">CSV Product Import</h1><p className="mt-3 max-w-3xl text-[#6B7280]">Match rows to master products, attach new merchant offers, update duplicate merchants, and hold uncertain matches for review.</p></header><div className="mt-8"><ProductCsvImporter/></div></div>}
