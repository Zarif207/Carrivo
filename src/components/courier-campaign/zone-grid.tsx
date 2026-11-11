import { Building2 } from "lucide-react";
import { connection } from "next/server";
import { Suspense } from "react";
import { Section } from "@/components/public/section";
import { Skeleton } from "@/components/ui/skeleton";
import { getPublicHubs, getPublicZones } from "@/lib/data/public";
import type { Hub, Zone } from "@/types";

/*
 * /drive-with-carrivo's live zone grid: every active zone with its hubs, from the public API
 * ("use cache", hours). Like the home page's coverage section it renders without a <Suspense> above
 * it, so the zones are in the prerendered HTML (JavaScript off included); if the API fails while
 * prerendering, it retries at request time under a skeleton instead of baking the outage in.
 */

interface ZoneTile {
  zone: Zone;
  hubs: Hub[];
}

async function loadTiles(): Promise<ZoneTile[] | null> {
  try {
    const [zones, hubs] = await Promise.all([getPublicZones(), getPublicHubs()]);
    return zones
      .filter((zone) => zone.isActive)
      .map((zone) => ({ zone, hubs: hubs.filter((hub) => hub.isActive && hub.zone.id === zone.id) }));
  } catch {
    return null;
  }
}

export async function DriveZoneGrid() {
  const tiles = await loadTiles();
  return (
    <Section
      id="zones"
      tone="dark"
      title="Where you could deliver"
      intro="Every zone Carrivo serves right now, read live from our network. Choose one when you apply, or leave it to the admin who reviews it."
    >
      {tiles ? (
        <ZoneTiles tiles={tiles} />
      ) : (
        <Suspense fallback={<ZoneGridSkeleton />}>
          <ZoneGridAtRequestTime />
        </Suspense>
      )}
    </Section>
  );
}

async function ZoneGridAtRequestTime() {
  await connection();
  const tiles = await loadTiles();
  if (!tiles) {
    return (
      <div className="rounded-2xl bg-white/[0.04] p-8 ring-1 ring-sidebar-border">
        <p className="text-lg font-semibold">Our zones couldn&rsquo;t be loaded right now.</p>
        <p className="mt-1 text-sidebar-muted">You can still apply: the form lists every zone, and choosing one is optional.</p>
      </div>
    );
  }
  return <ZoneTiles tiles={tiles} />;
}

function ZoneTiles({ tiles }: { tiles: ZoneTile[] }) {
  if (tiles.length === 0) {
    return (
      <p className="rounded-2xl bg-white/[0.04] p-8 text-lg ring-1 ring-sidebar-border">
        No zones are open yet. You can still apply; an admin assigns your zone when you&rsquo;re approved.
      </p>
    );
  }
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {tiles.map(({ zone, hubs }) => (
        <li key={zone.id} className="flex flex-col gap-4 rounded-2xl bg-white/[0.045] p-6 ring-1 ring-white/10">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-xl font-bold tracking-tight">{zone.name}</h3>
            <span className="rounded-full bg-white/8 px-2.5 py-1 text-xs font-semibold text-sidebar-muted">{zone.code}</span>
          </div>
          {zone.description ? <p className="line-clamp-2 text-sidebar-muted">{zone.description}</p> : null}
          <p className="mt-auto flex items-start gap-2 text-sm">
            <Building2 className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
            {hubs.length === 0 ? (
              <span className="text-sidebar-muted">No hub listed yet</span>
            ) : (
              <span>
                <span className="font-semibold">{hubs.length === 1 ? "1 hub" : `${hubs.length} hubs`}</span>
                <span className="text-sidebar-muted">: {[...new Set(hubs.map((hub) => hub.city))].join(", ")}</span>
              </span>
            )}
          </p>
        </li>
      ))}
    </ul>
  );
}

function ZoneGridSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton key={i} className="h-40 rounded-2xl bg-white/[0.06]" />
      ))}
    </div>
  );
}
