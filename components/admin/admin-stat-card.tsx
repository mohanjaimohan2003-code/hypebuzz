import { AdminIcon, type AdminIconName } from "./admin-icon";

type AdminStatCardProps = {
  label: string;
  value: number | string;
  icon: AdminIconName;
  description: string;
  change?: number | null;
  accent?: "blue" | "green" | "orange" | "purple";
};

const accents = {
  blue: "border-t-[#2563EB] bg-[#EFF6FF] text-[#1D4ED8]",
  green: "border-t-[#16A34A] bg-[#F0FDF4] text-[#15803D]",
  orange: "border-t-[#EA580C] bg-[#FFF7ED] text-[#C2410C]",
  purple: "border-t-[#7C3AED] bg-[#F5F3FF] text-[#6D28D9]",
};

const numberFormatter = new Intl.NumberFormat("en-IN");

export function AdminStatCard({
  label,
  value,
  icon,
  description,
  change,
  accent = "blue",
}: AdminStatCardProps) {
  return (
    <article className={`rounded-2xl border border-t-4 border-[#E5E7EB] bg-white p-5 shadow-[0_4px_16px_rgba(17,24,39,0.05)] ${accents[accent].split(" ")[0]}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-[#6B7280]">{label}</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-[#111827]">
            {typeof value === "number" ? numberFormatter.format(value) : value}
          </p>
        </div>
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] ${accents[accent].split(" ").slice(1).join(" ")}`}>
          <AdminIcon className="h-5 w-5" name={icon} />
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm leading-5"><p className="text-[#6B7280]">{description}</p>{change !== undefined && change !== null ? <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${change >= 0 ? "bg-[#DCFCE7] text-[#166534]" : "bg-[#FEF2F2] text-[#B91C1C]"}`}>{change >= 0 ? "↑" : "↓"} {Math.abs(change)}%</span> : null}</div>
    </article>
  );
}
