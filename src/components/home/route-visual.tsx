import { SHIPMENT_STATUS_META } from "@/lib/status";
import { cn } from "@/lib/utils";

/*
 * The hero's route: a map-less corridor from the sender's door through two hubs to the receiver.
 * Server-rendered SVG (it paints with the HTML; nothing waits for JS). GSAP later moves the parcel
 * markers along the path (components/home/gsap-scenes.tsx); the stop rings pulse with CSS only.
 * Under reduced motion everything stays still.
 */

/** viewBox units. Every stop is a segment end of ROUTE, so it sits exactly on the path. */
const W = 640;
const H = 300;

export const ROUTE_PATH =
  "M48 228 C 98 228 118 128 178 128 C 238 128 260 170 320 170 C 380 170 402 92 462 92 C 522 92 546 176 592 176";

/** Stages shown along the route, named like the real status timeline. */
const STOPS = [
  { x: 48, y: 228, label: "Picked up", detail: "At your door", above: false },
  { x: 178, y: 128, label: SHIPMENT_STATUS_META.AT_ORIGIN_HUB.label, detail: "Sorted near you", above: true },
  { x: 320, y: 170, label: SHIPMENT_STATUS_META.IN_TRANSIT.label, detail: "Between hubs", above: false },
  { x: 462, y: 92, label: SHIPMENT_STATUS_META.AT_DESTINATION_HUB.label, detail: "Near the receiver", above: true },
  { x: 592, y: 176, label: SHIPMENT_STATUS_META.DELIVERED.label, detail: "Photo on hand-over", above: false },
] as const;

/** Parcel markers rest between stops before the animation starts (and forever under reduced motion). */
const PARCELS = [
  { x: 118, y: 172 },
  { x: 392, y: 140 },
  { x: 538, y: 140 },
];

const pct = (value: number, total: number) => `${(value / total) * 100}%`;

export function RouteVisual({ className }: { className?: string }) {
  return (
    <figure data-route-visual="" className={cn("relative isolate overflow-hidden rounded-panel bg-ink p-4 text-ink-foreground shadow-overlay sm:p-6", className)}>
      {/* Faint coordinate grid: the "map" without a map. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.07] [background-image:radial-gradient(currentColor_1px,transparent_1px)] [background-size:22px_22px]"
      />
      <div aria-hidden="true" className="pointer-events-none absolute -top-24 -right-24 -z-10 size-72 rounded-full bg-brand/25 blur-3xl" />

      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold text-sidebar-muted">One parcel, every stop</span>
        <span className="inline-flex items-center gap-2 rounded-full bg-white/8 px-3 py-1 font-semibold">
          <span className="size-2 rounded-full bg-brand" aria-hidden="true" />
          Tracked
        </span>
      </div>

      <div className="relative mt-4 aspect-[640/300] w-full">
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 size-full overflow-visible" aria-hidden="true" focusable="false">
          {/* Road */}
          <path d={ROUTE_PATH} fill="none" stroke="currentColor" strokeOpacity="0.14" strokeWidth="14" strokeLinecap="round" />
          <path
            data-route-path=""
            d={ROUTE_PATH}
            fill="none"
            className="stroke-brand"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="2 9"
          />
          {/* Stops: a pulsing ring (CSS) around a solid dot. */}
          {STOPS.map((stop, i) => (
            <g key={stop.label}>
              <circle cx={stop.x} cy={stop.y} r="9" className="animate-stop-pulse fill-brand/40" style={{ ["--i" as string]: i }} />
              <circle cx={stop.x} cy={stop.y} r="8" className="fill-ink stroke-brand" strokeWidth="3" />
              <circle cx={stop.x} cy={stop.y} r="3" className="fill-brand" />
            </g>
          ))}
          {/* Parcels */}
          {PARCELS.map((parcel, i) => (
            <g key={i} data-parcel="" transform={`translate(${parcel.x} ${parcel.y})`}>
              <rect x="-11" y="-11" width="22" height="22" rx="6" className="fill-brand" />
              <path d="M-11 -3 H11 M0 -11 V11" className="stroke-ink" strokeOpacity="0.55" strokeWidth="2" />
            </g>
          ))}
        </svg>

        {/* Stage labels: real text (screen readers get them in order); positioned on the route from sm up. */}
        <ol aria-label="Tracking stages" className="sr-only sm:not-sr-only">
          {STOPS.map((stop) => (
            <li
              key={stop.label}
              className={cn(
                "absolute w-28 -translate-x-1/2 text-center text-xs leading-tight",
                stop.above ? "-translate-y-[calc(100%+1.1rem)]" : "translate-y-[1.1rem]",
              )}
              style={{ left: pct(stop.x, W), top: pct(stop.y, H) }}
            >
              <span className="block font-bold">{stop.label}</span>
              <span className="block text-sidebar-muted">{stop.detail}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Below sm the stage names would collide on the route: show them as a list instead. */}
      <ol aria-hidden="true" className="mt-4 flex flex-wrap gap-1.5 sm:hidden">
        {STOPS.map((stop) => (
          <li key={stop.label} className="rounded-full bg-white/8 px-2.5 py-1 text-xs font-semibold">
            {stop.label}
          </li>
        ))}
      </ol>
      <figcaption className="sr-only">Illustration: a parcel moving from pickup through two hubs to the receiver&rsquo;s door.</figcaption>
    </figure>
  );
}
