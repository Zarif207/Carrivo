import { CalendarDays, Camera, MapPinned } from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * The courier campaign's shared visual language (home section and /drive-with-carrivo): the headline,
 * the three benefit chips and the orange route line. Server components; motion is layered on by
 * campaign-motion.ts and never hides content before JavaScript runs.
 */

export const CAMPAIGN_HEADLINE = "Drive with Carrivo.";

export const CAMPAIGN_CHIPS = [
  { icon: MapPinned, label: "Choose your zone" },
  { icon: CalendarDays, label: "Choose your hours" },
  { icon: Camera, label: "Photo at every hand-over" },
] as const;

export function CampaignChips({ tone = "page", className }: { tone?: "page" | "ink"; className?: string }) {
  return (
    <ul aria-label="What you get" className={cn("flex flex-wrap gap-2", className)}>
      {CAMPAIGN_CHIPS.map(({ icon: Icon, label }) => (
        <li
          key={label}
          className={cn(
            "inline-flex items-center gap-2 rounded-full py-1.5 pr-3.5 pl-2 text-sm font-semibold",
            tone === "ink" ? "bg-white/8 text-ink-foreground ring-1 ring-white/12" : "bg-card text-card-foreground shadow-card ring-1 ring-border",
          )}
        >
          <span className="grid size-6 place-items-center rounded-full bg-brand text-brand-foreground">
            <Icon className="size-3.5" aria-hidden="true" />
          </span>
          {label}
        </li>
      ))}
    </ul>
  );
}

/**
 * The campaign headline, one word per span. `mode="css"` rises with CSS on first paint (a page's
 * LCP heading: visible from the first byte); `mode="scroll"` stays put until GSAP reveals it in view
 * (below the fold only). Screen readers get the sentence once.
 */
export function CampaignHeadline({
  as: Tag,
  id,
  text = CAMPAIGN_HEADLINE,
  mode,
  className,
}: {
  as: "h1" | "h2";
  id: string;
  text?: string;
  mode: "css" | "scroll";
  className?: string;
}) {
  const words = text.split(" ");
  return (
    <Tag id={id} className={cn("font-display text-display-1 tracking-[-0.04em]", className)}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((word, i) => (
          // The clip box lets each word rise from below its own baseline; pb keeps descenders.
          <span key={`${word}-${i}`} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
            <span
              data-campaign-word={mode === "scroll" ? "" : undefined}
              className={cn("inline-block", mode === "css" && "animate-word-rise")}
              style={mode === "css" ? { ["--i" as string]: i } : undefined}
            >
              {word}
            </span>
            {i < words.length - 1 ? " " : null}
          </span>
        ))}
      </span>
    </Tag>
  );
}

/** Long orange route lines across a whole band (decorative). They flow only while [data-live] is set. */
export function CampaignRouteLines({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1440 640"
      preserveAspectRatio="xMidYMid slice"
      className={cn("pointer-events-none absolute inset-0 -z-10 size-full", className)}
      aria-hidden="true"
      focusable="false"
    >
      <path d="M-40 610 C 300 610 420 470 740 470 S 1120 250 1480 230" fill="none" className="stroke-brand" strokeOpacity="0.12" strokeWidth="40" strokeLinecap="round" />
      <path
        data-flow=""
        d="M-40 610 C 300 610 420 470 740 470 S 1120 250 1480 230"
        fill="none"
        className="stroke-brand"
        strokeOpacity="0.7"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="6 18"
      />
      <path
        data-flow=""
        style={{ ["--delay" as string]: "-0.7s" }}
        d="M-40 620 C 380 600 520 470 860 470 S 1260 380 1480 420"
        fill="none"
        className="stroke-brand"
        strokeOpacity="0.28"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="6 18"
      />
    </svg>
  );
}
