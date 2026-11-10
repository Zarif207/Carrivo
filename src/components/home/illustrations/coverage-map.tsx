import { connection } from "next/server";
import { Skeleton } from "@/components/ui/skeleton";
import { getPublicHubs, getPublicZones } from "@/lib/data/public";
import { MAP_H, MAP_W, US_OUTLINE_PATH, locateZone, type LabelSide } from "@/lib/geo/us-map";
import { cn } from "@/lib/utils";
import { sortZones } from "@/lib/zones";

const FRAME = "rounded-2xl bg-white/5 p-4 ring-1 ring-sidebar-border sm:p-6";
const pct = (value: number, total: number) => `${(value / total) * 100}%`;
const hubCount = (n: number) => (n === 1 ? "1 hub" : `${n} hubs`);

/** Label offset from the pin (the pin is ~16px across at full size). */
const LABEL_POSITION: Record<LabelSide, string> = {
  right: "translate-x-3 -translate-y-1/2",
  left: "-translate-x-[calc(100%+0.75rem)] -translate-y-1/2",
  above: "-translate-x-1/2 -translate-y-[calc(100%+0.6rem)]",
};

/**
 * A stylised US map with a pin for each active zone that has active hubs, from the public API
 * (request-time under Suspense, cached data underneath). Pins come from a lookup table of metro
 * centres (lib/geo/us-map.ts); a zone the table doesn't know is left off the map and stays in the
 * zone cards below, so a pin is never in the wrong place.
 */
export async function CoverageMap({ className }: { className?: string }) {
  await connection();
  let zones;
  let hubs;
  try {
    [zones, hubs] = await Promise.all([getPublicZones(), getPublicHubs()]);
  } catch {
    return null; // the zone cards below show the "couldn't load" message
  }

  const active = sortZones(zones.filter((zone) => zone.isActive)).map((zone) => ({
    zone,
    hubs: hubs.filter((hub) => hub.isActive && hub.zone.id === zone.id).length,
    pin: locateZone(zone.name),
  }));
  const pinned = active.filter((entry) => entry.pin !== null && entry.hubs > 0);
  const unpinned = active.length - pinned.length;
  if (pinned.length === 0) return null;

  const label = `Map of the United States with Carrivo's ${active.length} zones: ${active.map((e) => `${e.zone.name} (${hubCount(e.hubs)})`).join(", ")}.`;

  return (
    <figure className={cn(FRAME, className)}>
      <div className="relative aspect-[600/370] w-full">
        <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} role="img" aria-label={label} className="absolute inset-0 size-full overflow-visible">
          <defs>
            <pattern id="carrivo-us-dots" width="9" height="9" patternUnits="userSpaceOnUse">
              <circle cx="4.5" cy="4.5" r="1.7" fill="currentColor" fillOpacity="0.32" />
            </pattern>
          </defs>
          <path d={US_OUTLINE_PATH} fill="url(#carrivo-us-dots)" />
          <path d={US_OUTLINE_PATH} fill="none" stroke="currentColor" strokeOpacity="0.22" strokeWidth="1.5" strokeLinejoin="round" />
          {pinned.map(({ zone, pin }) =>
            pin ? (
              <g key={zone.id}>
                <circle data-map-pulse="" cx={pin.x} cy={pin.y} r="9" className="fill-brand" fillOpacity="0.3" />
                <circle cx={pin.x} cy={pin.y} r="7.5" className="fill-ink stroke-brand" strokeWidth="3" />
                <circle cx={pin.x} cy={pin.y} r="3" className="fill-brand" />
              </g>
            ) : null,
          )}
        </svg>
        {/* Visible labels (the SVG's label already says all of this to screen readers). */}
        <ul aria-hidden="true">
          {pinned.map(({ zone, pin }) =>
            pin ? (
              <li
                key={zone.id}
                className={cn("absolute text-[0.6875rem] leading-none font-bold whitespace-nowrap sm:text-sm", LABEL_POSITION[pin.label])}
                style={{ left: pct(pin.x, MAP_W), top: pct(pin.y, MAP_H) }}
              >
                {pin.short}
              </li>
            ) : null,
          )}
        </ul>
      </div>
      <figcaption className="mt-3 text-sm text-sidebar-muted">
        Pins mark each metro area, not exact hub addresses. Every zone and hub is listed below.
        {unpinned > 0 ? ` ${unpinned === 1 ? "One zone isn't" : `${unpinned} zones aren't`} on the map yet.` : null}
      </figcaption>
    </figure>
  );
}

export function CoverageMapSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn(FRAME, className)} aria-hidden="true">
      <Skeleton className="aspect-[600/370] w-full rounded-xl bg-white/10" />
      <Skeleton className="mt-3 h-10 w-64 bg-white/10 sm:h-5" />
    </div>
  );
}
