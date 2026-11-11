import type { ZonePin } from "@/lib/geo/us-map";
import type { Hub, ServiceType, Zone } from "@/types";

/*
 * The home page's "Where we deliver" model, built from the live zones and hubs (plain module: server
 * and client code, and the node tests). Nothing here knows how many zones exist: regions, the route
 * network and the map clusters are all derived from whatever the API returns. Type-only imports, so
 * the node tests can load it directly; the map lookup (lib/geo/us-map.ts) and state names
 * (lib/us.ts) are passed in as `geo`.
 */

export type Region = "West" | "South" | "Midwest" | "Northeast" | "Michigan" | "Other";
/** Tab order. "Other" only appears when a zone's state can't be read. */
export const REGIONS: readonly Region[] = ["West", "South", "Midwest", "Northeast", "Michigan", "Other"];

/** US Census regions by state, with Michigan as its own group (it has the densest network). */
const STATE_REGION: Readonly<Record<string, Region>> = Object.fromEntries([
  ...["AK", "AZ", "CA", "CO", "HI", "ID", "MT", "NM", "NV", "OR", "UT", "WA", "WY"].map((s) => [s, "West"]),
  ...["AL", "AR", "DC", "DE", "FL", "GA", "KY", "LA", "MD", "MS", "NC", "OK", "SC", "TN", "TX", "VA", "WV"].map((s) => [s, "South"]),
  ...["IA", "IL", "IN", "KS", "MN", "MO", "ND", "NE", "OH", "SD", "WI"].map((s) => [s, "Midwest"]),
  ...["CT", "MA", "ME", "NH", "NJ", "NY", "PA", "RI", "VT"].map((s) => [s, "Northeast"]),
  ["MI", "Michigan"],
]);

/** "2 Woodward Ave, Detroit, MI 48226" → "MI". US addresses end in "City, ST ZIP". */
export function stateOf(address: string): string | null {
  return /,\s*([A-Z]{2})\s+\d{5}(?:-\d{4})?\s*$/.exec(address.trim())?.[1] ?? null;
}

/** "Flint, Burton, Grand Blanc and Flushing." → ["Flint", "Burton", "Grand Blanc", "Flushing"]. */
export function coverageAreas(description: string | null): string[] {
  if (!description) return [];
  return description
    .replace(/[.;]+\s*$/, "")
    .split(/\s*,\s*(?:and\s+)?|\s+and\s+|\s*&\s*/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1));
}

/** Google Maps search for an address (no API key, opens the app on phones). */
export const directionsUrl = (address: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

/** "(313) 555-0111" → "tel:+13135550111". */
export function telHref(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return `tel:${digits.length === 10 ? `+1${digits}` : digits.length === 11 && digits.startsWith("1") ? `+${digits}` : digits}`;
}

export interface CoverageHub {
  id: string;
  name: string;
  address: string;
  phone: string | null;
}

export interface CoverageZone {
  id: string;
  name: string;
  code: string;
  region: Region;
  /** State of the main hub, e.g. "MI" (null when no hub has a readable address). */
  state: string | null;
  areas: string[];
  hubs: CoverageHub[];
  /** Map position, or null when the zone isn't in the lookup table yet. */
  pin: ZonePin | null;
  /** Codes of the zones it has a route to, nearest first. */
  routesTo: string[];
}

export interface CoverageRoute {
  id: string;
  from: string;
  to: string;
  /** Part of the national spine between the regional anchor metros. */
  spine: boolean;
}

/** A map marker: one zone, or several close zones drawn as one numbered pin. */
export interface MapMarker {
  id: string;
  x: number;
  y: number;
  zoneIds: string[];
  /**
   * Clusters: "Michigan" when every zone shares a state, otherwise its parts ("Chicago and Michigan",
   * "New York, Philadelphia and Washington DC"). Empty for a single zone.
   */
  label: string;
}

/** A route as drawn on the main map (routes between two clustered zones collapse into one line). */
export interface MapRoute {
  id: string;
  from: string; // marker id
  to: string; // marker id
  zoneIds: string[]; // every zone whose route this line carries
  spine: boolean;
}

/** Markers and the lines between them at one cluster radius. */
export interface MapLayout {
  markers: MapMarker[];
  mapRoutes: MapRoute[];
}

export interface CoverageModel {
  zones: CoverageZone[];
  routes: CoverageRoute[];
  /** `wide` from 640px up; `compact` on phones, where 24px touch targets need pins further apart. */
  layouts: { wide: MapLayout; compact: MapLayout };
  unplaced: number;
  stats: { zones: number; hubs: number; routes: number };
}

const dist = (a: ZonePin, b: ZonePin) => Math.hypot(a.x - b.x, a.y - b.y);
const pairId = (a: string, b: string) => (a < b ? `${a}~${b}` : `${b}~${a}`);

/** Main hub (code HUB-<zone code>) first, then A–Z. */
const hubOrder = (a: Hub, b: Hub) => Number(!/^HUB-[A-Z0-9]+$/.test(a.code)) - Number(!/^HUB-[A-Z0-9]+$/.test(b.code)) || a.name.localeCompare(b.name, "en-US");

/**
 * Routes between placed zones: a spine (minimum spanning tree over each region's anchor metro: the
 * zone with the most hubs, then the most listed coverage areas), each zone to its `nearest` closest neighbours, and finally the shortest
 * link between any parts still apart, so no zone is ever isolated. Never all pairs.
 */
export function buildRoutes(zones: Pick<CoverageZone, "id" | "pin" | "region" | "hubs" | "areas" | "name">[], nearest = 2): CoverageRoute[] {
  const placed = zones.filter((zone): zone is typeof zone & { pin: ZonePin } => zone.pin !== null);
  const routes = new Map<string, CoverageRoute>();
  const add = (a: string, b: string, spine: boolean) => {
    if (a === b) return;
    const id = pairId(a, b);
    const existing = routes.get(id);
    if (existing) existing.spine ||= spine;
    else routes.set(id, { id, from: a < b ? a : b, to: a < b ? b : a, spine });
  };

  // Spine: Prim's MST over the anchors.
  const anchors = REGIONS.flatMap((region) => {
    const inRegion = placed.filter((zone) => zone.region === region);
    const size = (zone: (typeof inRegion)[number]) => [zone.hubs.length, zone.areas.length];
    const bigger = (a: (typeof inRegion)[number], b: (typeof inRegion)[number]) => {
      const [sa, sb] = [size(a), size(b)];
      return sa[0] !== sb[0] ? sa[0] > sb[0] : sa[1] !== sb[1] ? sa[1] > sb[1] : a.name < b.name;
    };
    return inRegion.length ? [inRegion.reduce((best, zone) => (bigger(zone, best) ? zone : best))] : [];
  });
  const inTree = new Set(anchors.slice(0, 1).map((zone) => zone.id));
  while (inTree.size < anchors.length) {
    let best: [string, string, number] | null = null;
    for (const a of anchors) {
      if (!inTree.has(a.id)) continue;
      for (const b of anchors) {
        if (inTree.has(b.id)) continue;
        const d = dist(a.pin, b.pin);
        if (!best || d < best[2]) best = [a.id, b.id, d];
      }
    }
    if (!best) break;
    add(best[0], best[1], true);
    inTree.add(best[1]);
  }

  // Each zone to its nearest neighbours.
  for (const zone of placed) {
    const others = placed.filter((other) => other.id !== zone.id).sort((a, b) => dist(zone.pin, a.pin) - dist(zone.pin, b.pin));
    for (const other of others.slice(0, nearest)) add(zone.id, other.id, false);
  }

  // Join anything still apart (union-find), shortest link first.
  const parent = new Map(placed.map((zone) => [zone.id, zone.id]));
  const find = (id: string): string => {
    const p = parent.get(id) ?? id;
    if (p === id) return id;
    const root = find(p);
    parent.set(id, root);
    return root;
  };
  for (const route of routes.values()) parent.set(find(route.from), find(route.to));
  const pairs = placed.flatMap((a, i) => placed.slice(i + 1).map((b) => ({ a, b, d: dist(a.pin, b.pin) }))).sort((x, y) => x.d - y.d);
  for (const { a, b } of pairs) {
    if (find(a.id) === find(b.id)) continue;
    add(a.id, b.id, false);
    parent.set(find(a.id), find(b.id));
  }

  return [...routes.values()];
}

/** Groups pins closer than `radius` map units (single linkage) so overlapping metros share one marker. */
export function clusterPins(zones: Pick<CoverageZone, "id" | "pin" | "state" | "name">[], radius: number, stateName: (code: string) => string | undefined = () => undefined): MapMarker[] {
  const placed = zones.filter((zone): zone is typeof zone & { pin: ZonePin } => zone.pin !== null);
  const groups: (typeof placed)[] = [];
  for (const zone of placed) {
    const touching = groups.filter((group) => group.some((member) => dist(member.pin, zone.pin) < radius));
    const merged = [zone, ...touching.flat()];
    for (const group of touching) groups.splice(groups.indexOf(group), 1);
    groups.push(merged);
  }
  return groups.map((group) => {
    const ids = group.map((zone) => zone.id).sort();
    // A state with several members is named by the state, a lone member by its own short name.
    const byState = new Map<string, typeof group>();
    for (const zone of [...group].sort((a, b) => a.pin.x - b.pin.x)) byState.set(zone.state ?? zone.id, [...(byState.get(zone.state ?? zone.id) ?? []), zone]);
    const parts = [...byState.entries()].map(([state, members]) => (members.length > 1 ? (stateName(state) ?? state) : shortName(members[0].name)));
    return {
      id: group.length === 1 ? group[0].id : `cluster:${ids.join(",")}`,
      x: Math.round((group.reduce((sum, zone) => sum + zone.pin.x, 0) / group.length) * 10) / 10,
      y: Math.round((group.reduce((sum, zone) => sum + zone.pin.y, 0) / group.length) * 10) / 10,
      zoneIds: ids,
      label: group.length === 1 ? "" : listNames(parts),
    };
  });
}

/** Pins closer than this (map units, viewBox 600 wide) would overlap from 640px up, so they cluster. */
export const CLUSTER_RADIUS = 12;
/**
 * On phones the map is ~320px wide (0.53px per unit): 24px touch targets (WCAG 2.5.8) need pins at
 * least ~45 units apart, so nearby metros share one numbered pin there.
 */
export const COMPACT_CLUSTER_RADIUS = 46;

/** Markers at `radius` and the main-map lines between them (routes inside a cluster go to its inset). */
export function layoutMap(
  zones: Pick<CoverageZone, "id" | "pin" | "state" | "name">[],
  routes: readonly CoverageRoute[],
  radius: number,
  stateName?: (code: string) => string | undefined,
): MapLayout {
  const markers = clusterPins(zones, radius, stateName);
  const markerOf = new Map(markers.flatMap((marker) => marker.zoneIds.map((id) => [id, marker.id] as const)));
  const mapRoutes = new Map<string, MapRoute>();
  for (const route of routes) {
    const from = markerOf.get(route.from);
    const to = markerOf.get(route.to);
    if (!from || !to || from === to) continue;
    const id = pairId(from, to);
    const existing = mapRoutes.get(id);
    if (existing) {
      existing.spine ||= route.spine;
      for (const zoneId of [route.from, route.to]) if (!existing.zoneIds.includes(zoneId)) existing.zoneIds.push(zoneId);
    } else {
      mapRoutes.set(id, { id, from: from < to ? from : to, to: from < to ? to : from, zoneIds: [route.from, route.to], spine: route.spine });
    }
  }
  return { markers, mapRoutes: [...mapRoutes.values()] };
}

/** Services quoted inside each zone (zone id → services), from getZoneServices. */
export type ZoneServices = Readonly<Record<string, readonly ServiceType[]>>;

/** How many zones offer Same day inside the zone. */
export const sameDayZones = (services: ZoneServices) => Object.values(services).filter((list) => list.includes("SAME_DAY")).length;

/** Everything the section renders (service badges stream in separately). Inactive zones and hubs are left out. */
export interface CoverageGeo {
  /** Map position for a zone name (null: not in the lookup table). */
  locate: (zoneName: string) => ZonePin | null;
  /** "MI" → "Michigan", for cluster names. */
  stateName?: (code: string) => string | undefined;
}

export function buildCoverage(zones: readonly Zone[], hubs: readonly Hub[], { locate, stateName }: CoverageGeo): CoverageModel {
  const active = zones.filter((zone) => zone.isActive).sort((a, b) => a.name.localeCompare(b.name, "en-US"));
  const base = active.map((zone) => {
    const zoneHubs = hubs.filter((hub) => hub.isActive && hub.zone.id === zone.id).sort(hubOrder);
    const state = zoneHubs.map((hub) => stateOf(hub.address)).find(Boolean) ?? null;
    return {
      id: zone.id,
      name: zone.name,
      code: zone.code,
      region: (state && STATE_REGION[state]) || "Other",
      state,
      areas: coverageAreas(zone.description),
      hubs: zoneHubs.map((hub) => ({ id: hub.id, name: hub.name, address: hub.address, phone: hub.phone })),
      pin: locate(zone.name),
      routesTo: [] as string[],
    } satisfies CoverageZone;
  });

  const routes = buildRoutes(base);
  const byId = new Map(base.map((zone) => [zone.id, zone]));
  for (const zone of base) {
    const linked = routes.flatMap((route) => (route.from === zone.id ? [route.to] : route.to === zone.id ? [route.from] : []));
    zone.routesTo = linked
      .map((id) => byId.get(id))
      .filter((other): other is CoverageZone => Boolean(other?.pin && zone.pin))
      .sort((a, b) => dist(zone.pin as ZonePin, a.pin as ZonePin) - dist(zone.pin as ZonePin, b.pin as ZonePin))
      .map((other) => other.code);
  }

  return {
    zones: base,
    routes,
    layouts: { wide: layoutMap(base, routes, CLUSTER_RADIUS, stateName), compact: layoutMap(base, routes, COMPACT_CLUSTER_RADIUS, stateName) },
    unplaced: base.filter((zone) => zone.pin === null).length,
    stats: {
      zones: base.length,
      hubs: base.reduce((sum, zone) => sum + zone.hubs.length, 0),
      routes: routes.length,
    },
  };
}

/* ───────────── Map drawing helpers (pure, shared by the map and the tests) ───────────── */

export type LabelSide = "right" | "left" | "above" | "below";

interface LabelItem {
  id: string;
  x: number;
  y: number;
  text: string;
  /** Radius of the pin the label belongs to. */
  r: number;
}

type Box = [number, number, number, number]; // x1, y1, x2, y2
const overlaps = (a: Box, b: Box) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];

/** The label's box on one side of its pin (font-size `font` map units, ~0.62em per character). */
export function labelBox(item: LabelItem, side: LabelSide, font: number): Box {
  const w = item.text.length * font * 0.62;
  const gap = item.r + 3;
  switch (side) {
    case "right":
      return [item.x + gap, item.y - font / 2, item.x + gap + w, item.y + font / 2];
    case "left":
      return [item.x - gap - w, item.y - font / 2, item.x - gap, item.y + font / 2];
    case "above":
      return [item.x - w / 2, item.y - gap - font, item.x + w / 2, item.y - gap];
    case "below":
      return [item.x - w / 2, item.y + gap, item.x + w / 2, item.y + gap + font];
  }
}

/**
 * Picks a side for every label so labels don't cover pins or each other and stay inside the map:
 * the first free side in right, left, above, below order, else the least crowded one.
 */
export function placeLabels(items: readonly LabelItem[], width: number, height: number, font = 12): Record<string, LabelSide> {
  const sides: LabelSide[] = ["right", "left", "above", "below"];
  const pins: Box[] = items.map((item) => [item.x - item.r, item.y - item.r, item.x + item.r, item.y + item.r]);
  const placed: Box[] = [];
  const result: Record<string, LabelSide> = {};
  // Most crowded pins first, so they get the free sides.
  const crowd = (item: LabelItem) => items.filter((other) => Math.hypot(other.x - item.x, other.y - item.y) < 60).length;
  for (const item of [...items].sort((a, b) => crowd(b) - crowd(a) || a.x - b.x)) {
    let best: { side: LabelSide; cost: number; box: Box } | null = null;
    for (const side of sides) {
      const box = labelBox(item, side, font);
      const outside = box[0] < 0 || box[1] < 0 || box[2] > width || box[3] > height ? 100 : 0;
      const cost = outside + [...pins, ...placed].filter((other) => overlaps(box, other)).length;
      if (!best || cost < best.cost) best = { side, cost, box };
      if (cost === 0) break;
    }
    if (best) {
      result[item.id] = best.side;
      placed.push(best.box);
    }
  }
  return result;
}

/** A gentle arc between two points, bowed towards the top of the map (SVG path data). */
export function arcPath(a: ZonePin, b: ZonePin, bow = 0.16): string {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  let nx = -dy / len;
  let ny = dx / len;
  if (ny > 0) [nx, ny] = [-nx, -ny];
  const r = (n: number) => Math.round(n * 10) / 10;
  return `M${r(a.x)} ${r(a.y)} Q${r((a.x + b.x) / 2 + nx * len * bow)} ${r((a.y + b.y) / 2 + ny * len * bow)} ${r(b.x)} ${r(b.y)}`;
}

/** Name without the "Metro" suffix: "Dallas–Fort Worth", "Detroit". */
export const shortName = (name: string) => name.replace(/\s+Metro(?:\s+Area)?$/i, "");

/** "Detroit and Flint", "Detroit, Flint and Lansing". */
export function listNames(names: readonly string[]): string {
  return names.length <= 1 ? (names[0] ?? "") : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}
