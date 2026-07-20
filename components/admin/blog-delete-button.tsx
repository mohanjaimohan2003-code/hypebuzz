"use client";
import { useActionState } from "react";
import { deleteBlogPost } from "@/app/admin/(protected)/blog/actions";
import { initialBlogActionState } from "@/lib/validation/blog";
export function BlogDeleteButton({ id, title }: { id: string; title: string }) { const [state, action, pending] = useActionState(deleteBlogPost.bind(null, id), initialBlogActionState); return <form action={action}><button aria-label={`Delete ${title}`} className="min-h-10 rounded-[10px] border border-[#FCA5A5] px-3 text-sm font-semibold text-[#B91C1C]" disabled={pending} type="submit">{pending ? "Deleting…" : "Delete"}</button>{state.status === "error" ? <p className="mt-1 text-xs text-[#B91C1C]">{state.message}</p> : null}</form>; }
