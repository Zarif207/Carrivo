import type { Hub, Zone } from "@/types";

/*
 * Zone and hub pickers (plain module: Server and Client Components). One ordering everywhere, so a
 * zone is in the same place in the calculator, the booking wizard and the admin screens.
 */

const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, "en-US");

/** Zones A–Z by name (the API's own order depends on the query). */
export const sortZones = <T extends Pick<Zone, "name">>(zones: readonly T[]): T[] => [...zones].sort(byName);

export const zoneOptions = (zones: readonly Pick<Zone, "id" | "name">[]) => sortZones(zones).map((zone) => ({ value: zone.id, label: zone.name }));

/** Active hubs of one zone only, main hub (code HUB-<zone code>) first, then A–Z. */
export function hubsInZone(hubs: readonly Hub[], zoneId: string | undefined): Hub[] {
  if (!zoneId) return [];
  const main = (hub: Hub) => (/^HUB-[A-Z0-9]+$/.test(hub.code) ? 0 : 1);
  return hubs.filter((hub) => hub.zone.id === zoneId && hub.isActive).sort((a, b) => main(a) - main(b) || byName(a, b));
}

export const hubOptions = (hubs: readonly Hub[]) => hubs.map((hub) => ({ value: hub.id, label: `${hub.name}, ${hub.city}` }));
