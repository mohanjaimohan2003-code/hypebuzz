import Image from "next/image";
import Link from "next/link";
import type { HomeFeatureAccent, HomeFeatureIcon } from "@/lib/data/homepage-content";

type Props = { title: string; description: string; actionLabel: string; href: string; icon: HomeFeatureIcon; accent: HomeFeatureAccent };
const accentStyles: Record<HomeFeatureAccent, { icon: string; glow: string; link: string }> = {
  orange: { icon: "border-[#F97316]/35", glow: "bg-[#F97316]/15", link: "text-[#FDBA74] hover:text-[#FED7AA]" },
  green: { icon: "border-[#22C55E]/35", glow: "bg-[#22C55E]/15", link: "text-[#86EFAC] hover:text-[#BBF7D0]" },
  purple: { icon: "border-[#A855F7]/35", glow: "bg-[#A855F7]/15", link: "text-[#D8B4FE] hover:text-[#E9D5FF]" },
};
const featureImages: Record<HomeFeatureIcon, { src: string }> = {
  flame: { src: "/home/hot-deal.png" },
  "trending-down": { src: "/home/price-drop.png" },
  search: { src: "/home/trending-products.png" },
};
function FeatureIcon({ icon }: { icon: HomeFeatureIcon }) { const image = featureImages[icon]; return <Image alt="" className="h-full w-full object-cover" height={80} src={image.src} width={80}/>; }
function ArrowIcon() { return <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24"><path d="M5 12h14m-5-5 5 5-5 5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/></svg>; }

export function HomeFeatureCard({ title, description, actionLabel, href, icon, accent }: Props) {
  const styles = accentStyles[accent];
  return <article className="group relative isolate min-h-44 overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(135deg,#0A1224_0%,#070B14_100%)] p-5 text-white shadow-[0_14px_32px_rgba(2,8,23,0.14)] sm:p-6">
    <div aria-hidden="true" className={`absolute -right-10 -top-12 -z-10 h-36 w-36 rounded-full blur-3xl ${styles.glow}`}/><div aria-hidden="true" className="absolute -bottom-10 right-3 -z-10 h-24 w-24 rotate-12 rounded-2xl border border-white/[0.06]"/>
    <div className="flex h-full items-start gap-4"><div className={`flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-[#030712] ${styles.icon}`}><FeatureIcon icon={icon}/></div><div className="flex min-h-32 min-w-0 flex-1 flex-col"><h2 className="text-lg font-bold leading-6 tracking-tight sm:text-xl">{title}</h2><p className="mt-2 max-w-xs text-sm leading-5 text-slate-300">{description}</p><Link className={`mt-auto inline-flex min-h-11 w-fit items-center gap-2 rounded-[10px] py-2 text-sm font-bold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA] focus-visible:ring-offset-2 focus-visible:ring-offset-[#070B14] motion-reduce:transition-none ${styles.link}`} href={href}>{actionLabel}<ArrowIcon/></Link></div></div>
  </article>;
}
