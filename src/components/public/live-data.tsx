import { ArrowRight, Building2, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PRICE_EXAMPLE_WEIGHT_LB, getPriceExamples, getPublicHubs, getPublicZones } from "@/lib/data/public";
import { formatMoney } from "@/lib/format";
import { SERVICE_NAMES } from "@/lib/status";
import { sortZones } from "@/lib/zones";
import type { Hub, Zone } from "@/types";

/*
 * Sections that read live public data. Each awaits connection() so it renders at request time
 * (inside the page's <Suspense>) instead of at build time: the API being slow or down never
 * breaks a deploy, and the cached data underneath ("use cache") keeps it fast.
 */

function Unavailable({ what }: { what: string }) {
  return (
    <p className="rounded-xl bg-card p-6 text-muted-foreground shadow-card">
      {what} couldn&rsquo;t be loaded right now. Refresh the page to try again.
    </p>
  );
}

/** "From $6.50": real quotes for a 2 lb parcel from the estimate endpoint. */
export async function PriceTeaser() {
  await connection();
  let examples;
  try {
    examples = await getPriceExamples();
  } catch {
    return <Unavailable what="Example prices" />;
  }
  if (examples.length === 0) return <Unavailable what="Example prices" />;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {examples.map((example) => (
        <div key={`${example.serviceType}-${example.label}`} className="flex flex-col gap-3 rounded-2xl bg-card p-6 shadow-card">
          <p className="text-sm font-semibold text-muted-foreground">
            {SERVICE_NAMES[example.serviceType]}, {PRICE_EXAMPLE_WEIGHT_LB} lb
          </p>
          <p className="text-[2.5rem] leading-none font-extrabold tracking-tight tabular">{formatMoney(example.estimate.total)}</p>
          <p className="text-sm text-muted-foreground">{example.label}</p>
          <p className="mt-auto border-t border-border pt-3 text-sm text-muted-foreground">
            Then {formatMoney(example.estimate.perLbFee)} per extra lb
          </p>
        </div>
      ))}
    </div>
  );
}

export function PriceTeaserSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="flex h-[12.5rem] flex-col gap-3 rounded-2xl bg-card p-6 shadow-card">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="mt-auto h-4 w-40" />
        </div>
      ))}
    </div>
  );
}

/** Zones with their hubs (addresses and phones are public on the API). */
export async function CoverageList({ showCta = true }: { showCta?: boolean }) {
  await connection();
  let zones: Zone[];
  let hubs: Hub[];
  try {
    [zones, hubs] = await Promise.all([getPublicZones(), getPublicHubs()]);
  } catch {
    return <Unavailable what="Our coverage" />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {sortZones(zones).map((zone) => {
        const zoneHubs = hubs.filter((hub) => hub.zone.id === zone.id && hub.isActive);
        return (
          <article key={zone.id} className="flex flex-col gap-4 rounded-2xl bg-card p-6 text-card-foreground shadow-card sm:p-7">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <h3 className="text-xl font-bold tracking-tight">{zone.name}</h3>
                {zone.description ? <p className="text-muted-foreground">{zone.description}</p> : null}
              </div>
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-secondary">
                <MapPin className="size-5" aria-hidden="true" />
              </span>
            </div>
            {zoneHubs.length > 0 ? (
              <ul className="space-y-3 border-t border-border pt-4">
                {zoneHubs.map((hub) => (
                  <li key={hub.id} className="space-y-1.5">
                    <p className="flex items-center gap-2 font-semibold">
                      <Building2 className="size-4 text-muted-foreground" aria-hidden="true" />
                      {hub.name}
                    </p>
                    {/* US addresses already end in "City, ST ZIP". */}
                    <p className="pl-6 text-sm text-muted-foreground">{hub.address}</p>
                    {hub.phone ? (
                      <p className="pl-6 text-sm">
                        <a href={`tel:${hub.phone.replace(/[\s-]/g, "")}`} className="inline-flex items-center gap-1.5 rounded font-id underline-offset-4 hover:underline">
                          <Phone className="size-3.5" aria-hidden="true" />
                          {hub.phone}
                        </a>
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </article>
        );
      })}
      {showCta ? (
        <div className="flex flex-col justify-between gap-4 rounded-2xl bg-ink p-6 text-ink-foreground sm:col-span-2 sm:p-7 md:flex-row md:items-center xl:col-span-4">
          <p className="text-lg font-semibold">Check the price between any two zones before you book.</p>
          <Button asChild size="lg">
            <Link href="/pricing">
              Get a price <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function CoverageSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="h-64 space-y-4 rounded-2xl bg-card p-7 shadow-card">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="mt-6 h-4 w-48" />
          <Skeleton className="h-4 w-56" />
        </div>
      ))}
    </div>
  );
}
