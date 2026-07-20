import type { SVGProps } from "react";

export type AdminIconName =
  | "dashboard"
  | "products"
  | "categories"
  | "brands"
  | "merchants"
  | "offers"
  | "blog"
  | "analytics"
  | "import"
  | "settings"
  | "website"
  | "sign-out"
  | "menu"
  | "close"
  | "arrow-right"
  | "plus"
  | "edit"
  | "archive"
  | "search";

type AdminIconProps = Omit<SVGProps<SVGSVGElement>, "name"> & {
  name: AdminIconName;
};

export function AdminIcon({ name, className = "h-5 w-5", ...props }: AdminIconProps) {
  const paths: Record<AdminIconName, React.ReactNode> = {
    dashboard: (
      <>
        <rect height="7" rx="1.5" width="7" x="3" y="3" />
        <rect height="7" rx="1.5" width="7" x="14" y="3" />
        <rect height="7" rx="1.5" width="7" x="3" y="14" />
        <rect height="7" rx="1.5" width="7" x="14" y="14" />
      </>
    ),
    products: (
      <>
        <path d="m4 7 8-4 8 4-8 4-8-4Z" />
        <path d="m4 7 8 4 8-4v10l-8 4-8-4V7Z" />
        <path d="M12 11v10" />
      </>
    ),
    categories: (
      <>
        <rect height="7" rx="1.5" width="7" x="3" y="3" />
        <rect height="7" rx="1.5" width="7" x="14" y="3" />
        <rect height="7" rx="1.5" width="7" x="3" y="14" />
        <path d="M14 17.5h7M17.5 14v7" />
      </>
    ),
    brands: (
      <>
        <path d="M20 13 13 20a2 2 0 0 1-2.8 0L4 13.8V4h9.8L20 10.2a2 2 0 0 1 0 2.8Z" />
        <circle cx="9" cy="9" r="1.25" />
      </>
    ),
    merchants: (
      <>
        <path d="M4 10v10h16V10" />
        <path d="M3 10h18l-2-6H5l-2 6Z" />
        <path d="M8 20v-6h8v6M7 10v1a2 2 0 0 0 4 0v-1M11 10v1a2 2 0 0 0 4 0v-1M15 10v1a2 2 0 0 0 4 0v-1" />
      </>
    ),
    offers: (
      <>
        <path d="M20 13.5 13.5 20 4 10.5V4h6.5L20 13.5Z" />
        <circle cx="8.5" cy="8.5" r="1.25" />
        <path d="m13 10-3 6M10.5 11h.01M12.5 15h.01" />
      </>
    ),
    blog: (
      <>
        <path d="M5 4h14v16H5V4Z" />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </>
    ),
    analytics: (
      <>
        <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
        <path d="m4 7 6-4 6 7 5-4" />
      </>
    ),
    import: (
      <>
        <path d="M12 3v12" />
        <path d="m7 10 5 5 5-5" />
        <path d="M5 21h14" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.86 2.86-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21H9.55v-.1A1.7 1.7 0 0 0 8.5 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.86-2.86.06-.06A1.7 1.7 0 0 0 4.1 15a1.7 1.7 0 0 0-1.5-1H2.5V10h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.34-1.88l-.06-.06L6.56 4.2l.06.06A1.7 1.7 0 0 0 8.5 4.6a1.7 1.7 0 0 0 1-1.5V3h4.05v.1A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.86 2.86-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.5 1h.1v4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
      </>
    ),
    website: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
      </>
    ),
    "sign-out": (
      <>
        <path d="M10 5H5v14h5" />
        <path d="M13 8l4 4-4 4M8 12h9" />
      </>
    ),
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    "arrow-right": <path d="M5 12h14M14 7l5 5-5 5" />,
    plus: <path d="M12 5v14M5 12h14" />,
    edit: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4L16.5 3.5Z" />
      </>
    ),
    archive: (
      <>
        <path d="M4 7h16v13H4V7Z" />
        <path d="M3 4h18v3H3V4ZM9 11h6" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m16 16 4 4" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
