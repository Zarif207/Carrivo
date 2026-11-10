import { connection } from "next/server";
import { Skeleton } from "@/components/ui/skeleton";
import { getPublicHubs, getPublicZones } from "@/lib/data/public";
import { MAP_H, MAP_W, US_OUTLINE_PATH, clusterPoints, locateHub } from "@/lib/geo/us-map";
import { cn } from "@/lib/utils";
import type { Hub } from "@/types";

const FRAME = "rounded-2xl bg-white/5 p-4 ring-1 ring-sidebar-border sm:p-6";
const pct = (value: number, total: number) => `${(value / total) * 100}%`;
const hubCount = (n: number) => (n === 1 ? "1 hub" : `${n} hubs`);

/** "Downtown LA Hub and Long Beach Hub", "A, B and C". */
function joinNames(names: string[]): string {
  return names.length <= 1 ? (names[0] ?? "") : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}

/** A gentle arc between two pins (a lane between zones), bowing upward. */
function lane(a: { x: number; y: number }, b: { x: number; y: number }): string {
  const mx = (a.x + b.x) / 2;
  const my = Math.min(a.y, b.y) - Math.hypot(b.x - a.x, b.y - a.y) * 0.22;
  return `M${a.x} ${a.y} Q${mx} ${my} ${b.x} ${b.y}`;
}

/**
 * A stylised US map with the real, active hubs from the public API (request-time under Suspense,
 * cached data underneath). Neighbouring hubs share one pin, labelled with their zone.
 */
export async function CoverageMap({ className }: { className?: string }) {
  await connection();
  let hubs: Hub[];
  try {
    const [zones, allHubs] = await Promise.all([getPublicZones(), getPublicHubs()]);
    const activeZones = new Set(zones.map((z) => z.id));
    hubs = allHubs.filter((hub) => hub.isActive && activeZones.has(hub.zone.id));
  } catch {
    return null; // the zone cards below show the "couldn't load" message
  }

  const points = hubs.flatMap((hub) => {
    const at = locateHub(hub);
    return at ? [{ ...at, item: hub }] : [];
  });
  const clusters = clusterPoints(points).map((cluster) => {
    const zoneNames = [...new Set(cluster.items.map((hub) => hub.zone.name))];
    return { ...cluster, title: joinNames(zoneNames), detail: hubCount(cluster.items.length) };
  });
  if (clusters.length === 0) return null;

  const label = `Map of the United States with Carrivo's ${hubCount(points.length)}: ${clusters
    .map((c) => `${joinNames(c.items.map((hub) => hub.name))} in ${c.title}`)
    .join("; ")}.`;

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
          {clusters.slice(1).map((cluster, i) => (
            <path
              key={`lane-${i}`}
              data-map-lane=""
              d={lane(clusters[0], cluster)}
              fill="none"
              className="stroke-brand"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="2 9"
            />
          ))}
          {clusters.map((cluster) => (
            <g key={`${cluster.x}-${cluster.y}`}>
              <circle data-map-pulse="" cx={cluster.x} cy={cluster.y} r="9" className="fill-brand" fillOpacity="0.3" />
              <circle cx={cluster.x} cy={cluster.y} r="8" className="fill-ink stroke-brand" strokeWidth="3" />
              <circle cx={cluster.x} cy={cluster.y} r="3.2" className="fill-brand" />
            </g>
          ))}
        </svg>
        {/* Visible labels (the SVG's label already says all of this to screen readers). */}
        <ul aria-hidden="true">
          {clusters.map((cluster) => {
            // Below the pin (the lanes bow upward), opening toward the middle of the map.
            const right = cluster.x < MAP_W * 0.6;
            return (
              <li
                key={`${cluster.x}-${cluster.y}`}
                className={cn("absolute pt-3.5 text-xs leading-tight sm:text-sm", right ? "pl-1" : "-translate-x-full pr-1 text-right")}
                style={{ left: pct(cluster.x, MAP_W), top: pct(cluster.y, MAP_H) }}
              >
                <span className="block font-bold whitespace-nowrap">{cluster.title}</span>
                <span className="block whitespace-nowrap text-sidebar-muted">{cluster.detail}</span>
              </li>
            );
          })}
        </ul>
      </div>
      <figcaption className="mt-3 text-sm text-sidebar-muted">Hub positions are approximate. Every address is listed below.</figcaption>
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
