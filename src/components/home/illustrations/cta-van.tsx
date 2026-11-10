import { cn } from "@/lib/utils";

/**
 * Final call to action: a delivery van leaving with a stack of parcels waiting (decorative).
 * Drawn for the orange panel in ink and off-white, which are the same in both themes.
 * GSAP drives the van in once it scrolls into view (never under reduced motion).
 */
export function CtaVan({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 360 200" className={cn("h-auto w-full", className)} aria-hidden="true" focusable="false">
      {/* Road */}
      <path d="M0 184 H360" className="stroke-ink" strokeOpacity="0.35" strokeWidth="3" strokeLinecap="round" strokeDasharray="14 12" />
      {/* Parcels waiting at the kerb */}
      <g>
        <rect x="6" y="138" width="46" height="40" rx="5" className="fill-ink" />
        <path d="M29 138 V178" className="stroke-ink-foreground" strokeOpacity="0.45" strokeWidth="3" />
        <rect x="14" y="104" width="32" height="30" rx="4" className="fill-ink-foreground" />
        <path d="M30 104 V134" className="stroke-ink" strokeOpacity="0.35" strokeWidth="3" />
      </g>
      <g data-cta-van="">
        {/* Speed lines */}
        {[96, 116, 136].map((y, i) => (
          <path key={y} d={`M${70 - i * 6} ${y} H${88 - i * 2}`} className="stroke-ink" strokeOpacity="0.4" strokeWidth="4" strokeLinecap="round" />
        ))}
        {/* Cargo box and cab */}
        <rect x="96" y="62" width="160" height="104" rx="12" className="fill-ink-foreground" />
        <path d="M256 86 H294 Q306 86 312 98 L328 130 Q332 138 332 146 V166 H256 Z" className="fill-ink-foreground" />
        <path d="M266 96 H292 Q298 96 301 102 L314 128 H266 Z" className="fill-ink" />
        <rect x="96" y="126" width="236" height="10" className="fill-ink" />
        <rect x="320" y="142" width="12" height="8" rx="2" className="fill-brand" />
        {/* Parcel mark on the side */}
        <rect x="150" y="80" width="44" height="34" rx="5" className="fill-brand" />
        <path d="M172 80 V114" className="stroke-ink" strokeOpacity="0.45" strokeWidth="3" />
        <path d="M150 92 H194" className="stroke-ink" strokeOpacity="0.45" strokeWidth="3" />
        {/* Wheels */}
        {[140, 294].map((cx) => (
          <g key={cx}>
            <circle cx={cx} cy="166" r="20" className="fill-ink" />
            <circle cx={cx} cy="166" r="8" className="fill-ink-foreground" />
          </g>
        ))}
      </g>
    </svg>
  );
}
