import Link from "next/link";
import { AdminIcon } from "./admin-icon";

type AdminEmptyStateProps = {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
};

export function AdminEmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: AdminEmptyStateProps) {
  return (
    <div className="flex flex-col items-center px-5 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EFF6FF] text-[#1D4ED8]">
        <AdminIcon className="h-6 w-6" name="products" />
      </span>
      <h3 className="mt-4 text-lg font-semibold text-[#111827]">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-[#6B7280]">
        {description}
      </p>
      {actionHref && actionLabel ? (
        <Link
          className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-[10px] bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#1D4ED8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 motion-reduce:transition-none"
          href={actionHref}
        >
          <AdminIcon className="h-5 w-5" name="plus" />
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
