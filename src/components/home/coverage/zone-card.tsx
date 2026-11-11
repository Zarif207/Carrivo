"use client";

// Client: a zone card reports hover and focus to the map (route highlight).
import { Building2, Navigation, Phone, Zap } from "lucide-react";
import type { Ref } from "react";
import { directionsUrl, telHref, type CoverageZone, type ZoneServices } from "@/lib/coverage";
import { SERVICE_NAMES } from "@/lib/status";
import { cn } from "@/lib/utils";

interface ZoneCardProps {
  zone: CoverageZone;
  /** Code → zone name, for the route line's tooltips and screen-reader text. */
  nameOf: (code: string) => string;
  /** Services quoted inside each zone; null when they couldn't be checked (no badges then). */
  services: ZoneServices | null;
  active: boolean;
  onActivate: (zoneId: string | null) => void;
  ref?: Ref<HTMLElement>;
}

/**
 * A zone as a parcel label: the zone code is the sort code, then where it goes (routes), what it covers
 * (areas), what it offers (services), and a tear line above the hubs you can call or drive to.
 */
export function ZoneCard({ zone, nameOf, services, active, onActivate, ref }: ZoneCardProps) {
  const headingId = `zone-${zone.code}-name`;
  return (
    <article
      ref={ref}
      id={`zone-${zone.code}`}
      tabIndex={-1}
      aria-labelledby={headingId}
      data-active={active || undefined}
      onPointerEnter={() => onActivate(zone.id)}
      onPointerLeave={() => onActivate(null)}
      onFocus={() => onActivate(zone.id)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) onActivate(null);
      }}
      className={cn(
        "group/zone relative flex w-full min-w-0 scroll-mt-28 flex-col rounded-2xl bg-card text-card-foreground shadow-card ring-1 ring-transparent outline-none transition-[transform,box-shadow] duration-300 ease-out dark:ring-white/[0.07]",
        "hover:-translate-y-1 hover:shadow-raised motion-reduce:hover:translate-y-0",
        "focus-visible:ring-3 focus-visible:ring-brand",
        active && "-translate-y-1 shadow-raised ring-2 ring-brand dark:ring-brand motion-reduce:translate-y-0",
      )}
    >
      <div className="flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p aria-hidden="true" className="font-display text-[2.75rem] leading-[0.9] font-extrabold tracking-tight">
              {zone.code}
            </p>
            <h3 id={headingId} className="mt-2 text-lg leading-snug font-bold tracking-tight">
              {zone.name} <span className="sr-only">({zone.code})</span>
            </h3>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5 pt-1">
            <span className="rounded-full bg-ink px-2.5 py-1 text-xs font-semibold text-ink-foreground dark:bg-white/10">{zone.region}</span>
            <span className="text-xs font-semibold text-muted-foreground tabular">{zone.hubs.length === 1 ? "1 hub" : `${zone.hubs.length} hubs`}</span>
          </div>
        </div>

        <RouteLine zone={zone} nameOf={nameOf} />

        {zone.areas.length ? (
          <div>
            <p className="sr-only">Covers</p>
            <ul className="flex flex-wrap gap-1.5">
              {zone.areas.map((area) => (
                <li key={area} className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
                  {area}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <ServiceBadges offered={services?.[zone.id]} />
      </div>

      {/* Tear line: notches in the section's colour, like a label's perforation. */}
      <div aria-hidden="true" className="relative mx-5 border-t-2 border-dashed border-border sm:mx-6">
        <span className="absolute -top-[9px] -left-7 size-4 rounded-full bg-ink sm:-left-8" />
        <span className="absolute -top-[9px] -right-7 size-4 rounded-full bg-ink sm:-right-8" />
      </div>

      {zone.hubs.length ? (
        <ul className="flex flex-col gap-4 p-5 sm:p-6" aria-label={`${zone.name} hubs`}>
          {zone.hubs.map((hub) => (
            <li key={hub.id} className="space-y-2">
              <p className="flex items-center gap-2 font-semibold">
                <Building2 className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                {hub.name}
              </p>
              <p className="pl-6 text-sm text-muted-foreground">{hub.address}</p>
              <div className="flex flex-wrap gap-2 pl-6">
                {hub.phone ? (
                  <a
                    href={telHref(hub.phone)}
                    aria-label={`Call ${hub.name}, ${hub.phone}`}
                    className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-semibold ring-1 ring-input outline-none transition-colors hover:bg-secondary focus-visible:ring-3 focus-visible:ring-brand"
                  >
                    <Phone className="size-3.5" aria-hidden="true" />
                    <span className="font-id">{hub.phone}</span>
                  </a>
                ) : null}
                <a
                  href={directionsUrl(hub.address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Directions to ${hub.name} (opens Google Maps)`}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-semibold ring-1 ring-input outline-none transition-colors hover:bg-secondary focus-visible:ring-3 focus-visible:ring-brand"
                >
                  <Navigation className="size-3.5" aria-hidden="true" />
                  Directions
                </a>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="p-5 text-sm text-muted-foreground sm:p-6">Hubs for this zone are opening soon.</p>
      )}
    </article>
  );
}

/** The zone's own pin, then a dashed line through the zones it has routes to (nearest first). */
function RouteLine({ zone, nameOf }: { zone: CoverageZone; nameOf: (code: string) => string }) {
  if (zone.routesTo.length === 0) {
    return <p className="text-sm text-muted-foreground">Not on the route map yet.</p>;
  }
  const names = zone.routesTo.map(nameOf);
  return (
    <div className="route-motif flex items-center gap-2 text-xs font-bold">
      <p className="sr-only">Routes to {names.join(", ")}</p>
      <span aria-hidden="true" className="size-3 shrink-0 rounded-full border-[3px] border-brand bg-ink" />
      <ol aria-hidden="true" className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden [mask-image:linear-gradient(to_right,black_calc(100%-1.5rem),transparent)]">
        {zone.routesTo.map((code, i) => (
          <li key={code} className="flex shrink-0 items-center gap-2" title={names[i]}>
            <svg viewBox="0 0 40 4" className="h-1 w-6 shrink-0 text-brand sm:w-8" preserveAspectRatio="none">
              <line data-flow="" x1="0" y1="2" x2="40" y2="2" stroke="currentColor" strokeWidth="3" strokeDasharray="4 8" strokeLinecap="round" />
            </svg>
            <span className="tabular">{code}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** "Same-day inside this zone" and the service levels quoted here; nothing when they couldn't be checked. */
function ServiceBadges({ offered }: { offered: ZoneServices[string] | undefined }) {
  if (!offered?.length) return null;
  return (
    <div>
      <p className="sr-only">Services inside this zone</p>
      <ul className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
        {offered.includes("SAME_DAY") ? (
          <li className="inline-flex items-center gap-1 rounded-full bg-brand px-2.5 py-1 text-brand-foreground">
            <Zap className="size-3.5" aria-hidden="true" />
            Same-day inside this zone
          </li>
        ) : null}
        {offered
          .filter((service) => service !== "SAME_DAY")
          .map((service) => (
            <li key={service} className="rounded-full px-2.5 py-1 ring-1 ring-input">
              {SERVICE_NAMES[service]}
            </li>
          ))}
      </ul>
    </div>
  );
}
