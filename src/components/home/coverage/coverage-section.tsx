import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { buildCoverage, type ZoneServices } from "@/lib/coverage";
import { getPublicHubs, getPublicZones, getZoneServices } from "@/lib/data/public";
import { locateZone } from "@/lib/geo/us-map";
import { US_STATES } from "@/lib/us";
import type { Hub, Zone } from "@/types";
import { CoverageExplorer } from "./coverage-explorer";

/**
 * "Where we deliver" on the home page: zones, hubs and per-zone service quotes from the public API
 * ("use cache", hours). The route network and map clusters are built from whatever comes back.
 *
 * Rendered without a <Suspense> above it, so it is part of the prerendered shell: every zone and hub
 * is in the HTML even with JavaScript off (a streamed Suspense chunk needs JS to appear), and the
 * quotes cost the build and the hourly regeneration, never a visitor. If the API fails while
 * prerendering, it falls back to a request-time retry under a skeleton, so an outage during a deploy
 * is never baked into the page.
 */
export async function CoverageNetwork() {
  const data = await loadCoverage();
  if (!data) {
    return (
      <Suspense fallback={<CoverageNetworkSkeleton />}>
        <CoverageAtRequestTime />
      </Suspense>
    );
  }
  return <CoverageView {...data} />;
}

async function CoverageAtRequestTime() {
  await connection();
  const data = await loadCoverage();
  return data ? <CoverageView {...data} /> : <CoverageError />;
}

async function loadCoverage(): Promise<{ zones: Zone[]; hubs: Hub[] } | null> {
  try {
    const [zones, hubs] = await Promise.all([getPublicZones(), getPublicHubs()]);
    return { zones, hubs };
  } catch {
    return null;
  }
}

async function CoverageView({ zones, hubs }: { zones: Zone[]; hubs: Hub[] }) {
  const model = buildCoverage(zones, hubs, { locate: locateZone, stateName: (code) => US_STATES.find(([c]) => c === code)?.[1] });
  if (model.zones.length === 0) return <CoverageEmpty />;
  // Badges are extra: without the quotes the cards simply show none.
  const services: ZoneServices | null = await getZoneServices(model.zones.map((zone) => zone.id).sort()).catch(() => null);
  return <CoverageExplorer model={model} services={services} />;
}

function CoverageError() {
  return (
    <div className="rounded-2xl bg-white/[0.04] p-8 ring-1 ring-sidebar-border">
      <p className="text-lg font-semibold">Our zones couldn&rsquo;t be loaded right now.</p>
      <p className="mt-2 text-sidebar-muted">
        Refresh the page to try again, or{" "}
        <Link href="/track" className="font-semibold text-ink-foreground underline underline-offset-4">
          track a parcel
        </Link>{" "}
        in the meantime.
      </p>
    </div>
  );
}

function CoverageEmpty() {
  return (
    <div className="rounded-2xl bg-white/[0.04] p-8 ring-1 ring-sidebar-border">
      <p className="text-lg font-semibold">No delivery zones are open yet.</p>
      <p className="mt-2 text-sidebar-muted">
        New zones appear here as soon as they open.{" "}
        <Link href="/contact" className="font-semibold text-ink-foreground underline underline-offset-4">
          Ask us about your area
        </Link>
        .
      </p>
    </div>
  );
}

/** Same footprint as the loaded section: map and stats, the filter row, then six cards. */
export function CoverageNetworkSkeleton() {
  const bar = "bg-white/10";
  return (
    <div className="space-y-12" aria-hidden="true">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start">
        <div className="space-y-4">
          <div className="rounded-2xl bg-white/[0.035] p-3 ring-1 ring-sidebar-border sm:p-5">
            <Skeleton className={`aspect-[600/370] w-full rounded-xl ${bar}`} />
          </div>
          <Skeleton className={`h-4 w-72 max-w-full ${bar}`} />
          <Skeleton className={`h-4 w-80 max-w-full ${bar}`} />
        </div>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 lg:grid-cols-1">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className={`h-12 w-16 ${bar}`} />
              <Skeleton className={`h-4 w-32 ${bar}`} />
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:justify-between">
          <Skeleton className={`h-11 w-full max-w-xl rounded-full ${bar}`} />
          <Skeleton className={`h-11 w-full rounded-full lg:max-w-xs ${bar}`} />
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-[27rem] space-y-4 rounded-2xl bg-card p-6 shadow-card dark:ring-1 dark:ring-white/[0.07]">
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-48" />
              <div className="flex flex-wrap gap-1.5">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-14 rounded-full" />
              </div>
              <Skeleton className="mt-8 h-4 w-44" />
              <Skeleton className="h-4 w-56" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
