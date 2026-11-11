"use client";

// Client: region tabs, search, "Show all" and the map/card highlight share state here. The server
// renders every zone and hub (so it all shows without JS); after hydration the list collapses to
// the first few, and the filters are written to the URL (?region=&zone=) so a view can be shared.
import { ChevronDown, Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SegmentedControl } from "@/components/shared/segmented-control";
import { Input } from "@/components/ui/input";
import { REGIONS, sameDayZones, type CoverageModel, type Region, type ZoneServices } from "@/lib/coverage";
import { scrollIntoCenter } from "@/lib/motion/scroll";
import { cn } from "@/lib/utils";
import { CountUp } from "./count-up";
import { NetworkMap } from "./network-map";
import { ZoneCard } from "./zone-card";

/** Cards shown before "Show all". */
const FIRST = 6;
type RegionFilter = Region | "all";

interface CoverageExplorerProps {
  model: CoverageModel;
  services: ZoneServices | null;
}

const matches = (zone: CoverageModel["zones"][number], query: string) => {
  if (!query) return true;
  const haystack = [zone.name, zone.code, zone.region, ...zone.areas, ...zone.hubs.flatMap((hub) => [hub.name, hub.address])].join(" ").toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .every((word) => haystack.includes(word));
};

export function CoverageExplorer({ model, services }: CoverageExplorerProps) {
  const [mounted, setMounted] = useState(false);
  const [region, setRegion] = useState<RegionFilter>("all");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const cards = useRef<Record<string, HTMLElement | null>>({});

  const regions = useMemo(() => REGIONS.filter((r) => model.zones.some((zone) => zone.region === r)), [model.zones]);
  const byCode = useMemo(() => new Map(model.zones.map((zone) => [zone.code, zone.name])), [model.zones]);
  const nameOf = useCallback((code: string) => byCode.get(code) ?? code, [byCode]);

  // Read a shared view from the URL once, after hydration (keeps the server HTML cacheable).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("region");
    const match = regions.find((r) => r.toLowerCase() === fromUrl?.toLowerCase());
    /* eslint-disable react-hooks/set-state-in-effect -- one-time sync from the URL after hydration */
    if (match) setRegion(match);
    setQuery(params.get("zone")?.slice(0, 60) ?? "");
    setMounted(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [regions]);

  // Write the view back without a server round trip (Next keeps useSearchParams in sync).
  useEffect(() => {
    if (!mounted) return;
    const url = new URL(window.location.href);
    if (region === "all") url.searchParams.delete("region");
    else url.searchParams.set("region", region.toLowerCase());
    if (query.trim()) url.searchParams.set("zone", query.trim());
    else url.searchParams.delete("zone");
    if (url.href !== window.location.href) window.history.replaceState(window.history.state, "", url);
  }, [mounted, region, query]);

  const filtered = model.zones.filter((zone) => (region === "all" || zone.region === region) && matches(zone, query.trim()));
  const collapsed = mounted && !expanded && filtered.length > FIRST;
  const visible = collapsed ? filtered.slice(0, FIRST) : filtered;

  /** A pin was chosen: make sure its card is listed, then bring it into view. */
  const selectZone = (zoneId: string) => {
    const index = model.zones.findIndex((zone) => zone.id === zoneId);
    const zone = model.zones[index];
    if (!zone) return;
    if (!filtered.some((z) => z.id === zoneId)) {
      setRegion("all");
      setQuery("");
    }
    const position = (filtered.some((z) => z.id === zoneId) ? filtered : model.zones).findIndex((z) => z.id === zoneId);
    if (position >= FIRST) setExpanded(true);
    setActive(zoneId);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const card = cards.current[zoneId];
        if (!card) return;
        card.focus({ preventScroll: true });
        scrollIntoCenter(card);
      }),
    );
  };

  const options = [
    { value: "all" as const, label: `All ${model.zones.length}` },
    ...regions.map((r) => ({ value: r, label: `${r} ${model.zones.filter((zone) => zone.region === r).length}` })),
  ];

  return (
    <div className="space-y-12">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start">
        <NetworkMap model={model} active={active} onActivate={setActive} onSelect={selectZone} />
        <Stats model={model} services={services} />
      </div>

      <div className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <SegmentedControl
            label="Region"
            options={options}
            value={region}
            onValueChange={(value) => {
              setRegion(value);
              setExpanded(false);
            }}
            className="bg-white/[0.06] ring-sidebar-border [&_[aria-checked=false]]:text-sidebar-muted [&_[aria-checked=false]:hover]:text-ink-foreground"
          />
          <div className="relative w-full lg:max-w-xs">
            <label htmlFor="coverage-search" className="sr-only">
              Search zones, cities and hubs
            </label>
            <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-sidebar-muted" aria-hidden="true" />
            <Input
              id="coverage-search"
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setExpanded(false);
              }}
              placeholder="Search a city, zone or hub"
              maxLength={60}
              autoComplete="off"
              className="h-11 rounded-full border-white/25 bg-white/[0.06] pr-10 pl-10 text-ink-foreground placeholder:text-sidebar-muted [&::-webkit-search-cancel-button]:hidden"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute top-1/2 right-2.5 grid size-7 -translate-y-1/2 place-items-center rounded-full text-sidebar-muted outline-none hover:bg-white/10 hover:text-ink-foreground focus-visible:ring-3 focus-visible:ring-brand"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>
        </div>

        <p role="status" className="text-sm text-sidebar-muted">
          {mounted ? (filtered.length === 0 ? null : `Showing ${visible.length} of ${filtered.length} ${filtered.length === 1 ? "zone" : "zones"}${region === "all" ? "" : ` in ${region}`}${query.trim() ? ` matching “${query.trim()}”` : ""}.`) : null}
        </p>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-start gap-3 rounded-2xl bg-white/[0.04] p-8 ring-1 ring-sidebar-border">
            <p className="text-lg font-semibold">No zone matches “{query.trim()}”{region === "all" ? "" : ` in ${region}`}.</p>
            <p className="text-sidebar-muted">Try a city name such as {model.zones[0]?.areas[0] ?? model.zones[0]?.name}, or search every region.</p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setRegion("all");
              }}
              className="rounded-full bg-brand px-5 py-2.5 font-semibold text-brand-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              Show every zone
            </button>
          </div>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((zone) => (
              <li key={zone.id} className="flex min-w-0">
                <ZoneCard
                  ref={(node) => {
                    cards.current[zone.id] = node;
                  }}
                  zone={zone}
                  nameOf={nameOf}
                  services={services}
                  active={active === zone.id}
                  onActivate={setActive}
                />
              </li>
            ))}
          </ul>
        )}

        {mounted && filtered.length > FIRST ? (
          <div className="flex justify-center">
            <button
              type="button"
              aria-expanded={!collapsed}
              onClick={() => setExpanded((open) => !open)}
              className="inline-flex h-12 items-center gap-2 rounded-full px-6 font-semibold ring-1 ring-white/25 outline-none transition-colors hover:bg-white/10 focus-visible:ring-3 focus-visible:ring-brand"
            >
              {collapsed ? `Show all ${filtered.length} zones` : "Show fewer zones"}
              <ChevronDown className={cn("size-4 transition-transform", !collapsed && "rotate-180")} aria-hidden="true" />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** Headline numbers, counted up the first time they appear. All from the live data. */
function Stats({ model, services }: { model: CoverageModel; services: ZoneServices | null }) {
  const sameDay = services ? sameDayZones(services) : null;
  const rows = [
    { value: model.stats.zones, label: model.stats.zones === 1 ? "delivery zone" : "delivery zones" },
    { value: model.stats.hubs, label: model.stats.hubs === 1 ? "sorting hub" : "sorting hubs" },
    { value: model.stats.routes, label: model.stats.routes === 1 ? "route between zones" : "routes between zones" },
    ...(sameDay === null ? [] : [{ value: sameDay, label: sameDay === 1 ? "zone with same-day delivery" : "zones with same-day delivery" }]),
  ];
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4 lg:grid-cols-1 lg:gap-y-0 lg:divide-y lg:divide-sidebar-border">
      {rows.map((row, i) => (
        <div key={row.label} className="flex flex-col-reverse gap-1 lg:py-5 lg:first:pt-0">
          <dt className="text-sm font-semibold text-sidebar-muted">{row.label}</dt>
          <dd className={cn("font-display text-5xl leading-none font-extrabold tracking-tight", i === 0 && "text-brand")}>
            <CountUp value={row.value} />
          </dd>
        </div>
      ))}
    </dl>
  );
}
