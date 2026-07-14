import Link from "next/link";
import type {
  HomeFeatureAccent,
  HomeFeatureIcon,
} from "@/lib/data/homepage-content";

type HomeFeatureCardProps = {
  title: string;
  description: string;
  actionLabel: string;
  href: string;
  icon: HomeFeatureIcon;
  accent: HomeFeatureAccent;
};

const accentStyles: Record<
  HomeFeatureAccent,
  { icon: string; glow: string; link: string }
> = {
  orange: {
    icon: "border-[#F97316]/35 bg-[#F97316]/15 text-[#FDBA74]",
    glow: "bg-[#F97316]/15",
    link: "text-[#FDBA74] hover:text-[#FED7AA]",
  },
  green: {
    icon: "border-[#22C55E]/35 bg-[#22C55E]/15 text-[#86EFAC]",
    glow: "bg-[#22C55E]/15",
    link: "text-[#86EFAC] hover:text-[#BBF7D0]",
  },
  purple: {
    icon: "border-[#A855F7]/35 bg-[#A855F7]/15 text-[#D8B4FE]",
    glow: "bg-[#A855F7]/15",
    link: "text-[#D8B4FE] hover:text-[#E9D5FF]",
  },
};

function FeatureIcon({ icon }: { icon: HomeFeatureIcon }) {
  if (icon === "flame") {
    return (
      <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24">
        <path d="M12.5 3.5c.4 3-1.8 4.3-3.1 6.1-1.1 1.5-1.5 3.2-.5 4.8.5-1.8 1.7-2.7 3.1-4.1.4 2.2 2.4 3.5 2.4 6.1 0 1.9-1.1 3.4-2.5 4.1 4.5-.2 7.1-3.3 7.1-7.2 0-4.1-2.5-7.2-6.5-9.8Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" />
        <path d="M8.8 20.1C6.5 19 5 16.8 5 14.2c0-2.2 1-4.1 2.7-5.7" stroke="currentColor" strokeLinecap="round" strokeWidth="1.9" />
      </svg>
    );
  }

  if (icon === "trending-down") {
    return (
      <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24">
        <path d="m4 7 6 6 4-4 6 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" />
        <path d="M15 15h5v-5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.9" />
      <path d="m16 16 4 4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.9" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path d="M5 12h14m-5-5 5 5-5 5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

export function HomeFeatureCard({
  title,
  description,
  actionLabel,
  href,
  icon,
  accent,
}: HomeFeatureCardProps) {
  const styles = accentStyles[accent];

  return (
    <article className="group relative isolate min-h-44 overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(135deg,#0A1224_0%,#070B14_100%)] p-5 text-white shadow-[0_14px_32px_rgba(2,8,23,0.14)] sm:p-6">
      <div aria-hidden="true" className={`absolute -right-10 -top-12 -z-10 h-36 w-36 rounded-full blur-3xl ${styles.glow}`} />
      <div aria-hidden="true" className="absolute -bottom-10 right-3 -z-10 h-24 w-24 rotate-12 rounded-2xl border border-white/[0.06]" />
      <div className="flex h-full items-start gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${styles.icon}`}>
          <FeatureIcon icon={icon} />
        </div>
        <div className="flex min-h-32 min-w-0 flex-1 flex-col">
          <h2 className="text-lg font-bold leading-6 tracking-tight sm:text-xl">{title}</h2>
          <p className="mt-2 max-w-xs text-sm leading-5 text-slate-300">{description}</p>
          <Link
            className={`mt-auto inline-flex min-h-11 w-fit items-center gap-2 rounded-[10px] py-2 text-sm font-bold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA] focus-visible:ring-offset-2 focus-visible:ring-offset-[#070B14] motion-reduce:transition-none ${styles.link}`}
            href={href}
          >
            {actionLabel}
            <ArrowIcon />
          </Link>
        </div>
      </div>
    </article>
  );
}
