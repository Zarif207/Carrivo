import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoMarkProps {
  className?: string;
}

/** A dotted route from pickup to doorstep on an orange tile. Reads on light, dark and the sidebar. */
export function LogoMark({ className }: LogoMarkProps) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-8 shrink-0", className)}>
      <rect width="32" height="32" rx="10" className="fill-brand" />
      <path
        d="M9.5 22.5C9.5 15 14 10.5 21.5 10.5"
        fill="none"
        className="stroke-ink"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeDasharray="0.1 4.4"
      />
      <circle cx="9.5" cy="22.5" r="2.6" className="fill-ink" />
      <circle cx="22.5" cy="10" r="4" fill="white" />
      <circle cx="22.5" cy="10" r="1.6" className="fill-ink" />
    </svg>
  );
}

interface LogoProps {
  href?: string | null;
  /** "inverse" for the near-black sidebar and footer. */
  tone?: "default" | "inverse";
  showWordmark?: boolean;
  className?: string;
  /** Next.js link prefetch; dashboards pass false so the marketing home page isn't preloaded there. */
  prefetch?: boolean;
}

export function Logo({ href = "/", tone = "default", showWordmark = true, className, prefetch }: LogoProps) {
  const content = (
    <>
      <LogoMark />
      {showWordmark ? (
        <span
          className={cn(
            "font-display text-[1.375rem] leading-none",
            tone === "inverse" ? "text-sidebar-foreground" : "text-foreground",
          )}
        >
          Carrivo
        </span>
      ) : null}
    </>
  );

  const classes = cn("inline-flex items-center gap-2.5 rounded-lg", className);

  if (href === null) return <span className={classes}>{content}</span>;
  return (
    <Link href={href} prefetch={prefetch} className={cn(classes, "outline-none focus-visible:ring-3 focus-visible:ring-ring/50")} aria-label="Carrivo home">
      {content}
    </Link>
  );
}
