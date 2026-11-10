import { cn } from "@/lib/utils";

/*
 * Small scenes for the three services (decorative: the card text says what each one is).
 * Original line drawings in the current text colour with orange accents, so they work on the
 * light card, the ink card and in both themes without any hard-coded colour.
 */

const SVG_PROPS = { viewBox: "0 0 168 84", "aria-hidden": true, focusable: false, fill: "none" } as const;
const LINE = { stroke: "currentColor", strokeWidth: 2.5, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const SOFT = { fill: "currentColor", fillOpacity: 0.08 } as const;

function Road() {
  return <path d="M6 76 H162" {...LINE} strokeOpacity={0.35} strokeDasharray="10 8" />;
}

function Wheel({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <>
      <circle cx={cx} cy={cy} r={r} fill="currentColor" />
      <circle cx={cx} cy={cy} r={r * 0.4} className="fill-brand" />
    </>
  );
}

/** Standard: a van with a parcel at the cargo door. */
function StandardScene() {
  return (
    <>
      <Road />
      <rect x="22" y="26" width="90" height="40" rx="7" {...SOFT} {...LINE} />
      <rect x="22" y="47" width="90" height="6" className="fill-brand" />
      <path d="M112 34 H130 L146 52 V66 H112 Z" {...SOFT} {...LINE} />
      <path d="M117 39 H128 L138 51 H117 Z" fill="currentColor" fillOpacity={0.25} />
      <rect x="4" y="50" width="16" height="16" rx="2.5" className="fill-brand" />
      <path d="M12 50 V66" className="stroke-ink" strokeOpacity={0.5} strokeWidth={2} />
      <Wheel cx={46} cy={67} r={8.5} />
      <Wheel cx={128} cy={67} r={8.5} />
    </>
  );
}

/** Express: a rider leaning into speed, box on the back. */
function ExpressScene() {
  return (
    <>
      <Road />
      {[30, 44, 58].map((y, i) => (
        <path key={y} d={`M${8 + i * 6} ${y} H${30 + i * 4}`} {...LINE} strokeOpacity={0.45} />
      ))}
      <rect x="40" y="26" width="26" height="20" rx="3" className="fill-brand" />
      <path d="M53 26 V46" className="stroke-ink" strokeOpacity={0.5} strokeWidth={2} />
      <path d="M58 64 L78 47 H106 L124 64" {...LINE} />
      <path d="M70 45 H92" {...LINE} strokeWidth={4} />
      <path d="M106 47 L113 32 H122" {...LINE} />
      <path d="M83 43 L99 24" {...LINE} strokeWidth={6} />
      <path d="M97 27 L114 33" {...LINE} />
      <path d="M84 44 L95 58" {...LINE} strokeWidth={4} />
      <circle cx="105" cy="17" r="8" className="fill-brand" />
      <Wheel cx={58} cy={64} r={12} />
      <Wheel cx={124} cy={64} r={12} />
    </>
  );
}

/** Same day: one sun arc from the pickup door to the delivery door. */
function SameDayScene() {
  const house = (x: number) => `M${x} 76 V52 L${x + 16} 38 L${x + 32} 52 V76`;
  return (
    <>
      <Road />
      <path d={house(10)} {...SOFT} {...LINE} />
      <path d={house(126)} {...SOFT} {...LINE} />
      <rect x="21" y="60" width="10" height="16" rx="1.5" fill="currentColor" fillOpacity={0.3} />
      <rect x="137" y="60" width="10" height="16" rx="1.5" fill="currentColor" fillOpacity={0.3} />
      <path d="M26 34 Q84 -14 142 34" {...LINE} strokeOpacity={0.55} strokeDasharray="3 7" />
      <circle cx="84" cy="22" r="10" className="fill-brand" />
      {[0, 60, 120, 180, 240, 300].map((deg) => (
        <path key={deg} d="M84 8 V4" {...LINE} className="stroke-brand" strokeWidth={2.5} transform={`rotate(${deg} 84 22)`} />
      ))}
      <rect x="148" y="66" width="11" height="10" rx="2" className="fill-brand" />
    </>
  );
}

const SCENES = { STANDARD: StandardScene, EXPRESS: ExpressScene, SAME_DAY: SameDayScene } as const;

export function ServiceScene({ service, className }: { service: keyof typeof SCENES; className?: string }) {
  const Scene = SCENES[service];
  return (
    <svg {...SVG_PROPS} className={cn("h-20 w-auto", className)}>
      <Scene />
    </svg>
  );
}
