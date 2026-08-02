"use client";
import { useState, useTransition } from "react";
import { deleteReview, moderateReview, type ReviewModerationResult } from "@/app/admin/(protected)/reviews/actions";
import type { ReviewStatus } from "@/lib/reviews/model";

export function ReviewModerationActions({ id, reviewerName, status }: { id: string; reviewerName: string; status: ReviewStatus }) {
  const [pending, start] = useTransition(); const [result, setResult] = useState<ReviewModerationResult>({ status: "idle", message: "" });
  function moderate(next: "approved" | "rejected") { start(async () => setResult(await moderateReview(id, next))); }
  return <div><div className="flex flex-wrap gap-2">{status !== "approved" ? <button className="min-h-10 rounded-[10px] border border-[#86EFAC] px-3 text-sm font-semibold text-[#166534] disabled:opacity-50" disabled={pending} onClick={() => moderate("approved")} type="button">Approve</button> : null}{status !== "rejected" ? <button className="min-h-10 rounded-[10px] border border-[#FDE68A] px-3 text-sm font-semibold text-[#92400E] disabled:opacity-50" disabled={pending} onClick={() => moderate("rejected")} type="button">Reject</button> : null}<button className="min-h-10 rounded-[10px] border border-[#FCA5A5] px-3 text-sm font-semibold text-[#B91C1C] disabled:opacity-50" disabled={pending} onClick={() => { if (window.confirm(`Delete the review by ${reviewerName}? This cannot be undone.`)) start(async () => setResult(await deleteReview(id))); }} type="button">Delete</button></div>{result.message ? <p className={`mt-2 text-xs font-medium ${result.status === "error" ? "text-[#B91C1C]" : "text-[#166534]"}`} role="status">{result.message}</p> : null}</div>;
}
