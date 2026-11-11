import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { serverFetch } from "@/lib/api/server";
import type { Hub, PriceEstimate, ServiceType, TrackingInfo, Zone } from "@/types";

/*
 * Public (no token) reads used by the marketing pages.
 * Zones, hubs and price examples change rarely, so they're cached ("use cache") and shared
 * across visitors. Errors are never cached: a failed call throws and the caller shows a fallback.
 */

export async function getPublicZones(): Promise<Zone[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("zones");
  const { data } = await serverFetch<Zone[]>(endpoints.zones.list, { auth: false, query: { limit: 100, sortBy: "name", sortOrder: "asc" } });
  return data;
}

export async function getPublicHubs(): Promise<Hub[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("hubs");
  const { data } = await serverFetch<Hub[]>(endpoints.hubs.list, { auth: false, query: { limit: 100, sortBy: "name", sortOrder: "asc" } });
  return data;
}

export interface PriceExample {
  label: string;
  serviceType: ServiceType;
  sameZone: boolean;
  estimate: PriceEstimate;
}

/** Weight used for the example quotes: the seeded rules' base weight, so the total is the base fee. */
export const PRICE_EXAMPLE_WEIGHT_LB = 2;

/** Real quotes for a 2 lb parcel from the estimate endpoint (same zone and cross zone) for the pricing teaser. */
export async function getPriceExamples(): Promise<PriceExample[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("pricing");
  const zones = await getPublicZones();
  if (zones.length === 0) return [];
  const [first, second = first] = zones;

  const quote = async (serviceType: ServiceType, origin: Zone, destination: Zone): Promise<PriceExample | null> => {
    try {
      const { data } = await serverFetch<PriceEstimate>(endpoints.pricing.estimate, {
        method: "POST",
        auth: false,
        body: { weightLb: PRICE_EXAMPLE_WEIGHT_LB, serviceType, originZoneId: origin.id, destinationZoneId: destination.id },
      });
      const sameZone = origin.id === destination.id;
      return { label: sameZone ? `Within ${origin.name}` : `${origin.name} to ${destination.name}`, serviceType, sameZone, estimate: data };
    } catch (error) {
      // 422 = this service isn't offered on this route; skip it rather than fail the section.
      if (ApiError.isApiError(error) && error.status === 422) return null;
      throw error;
    }
  };

  const results = await Promise.all([
    quote("STANDARD", first, first),
    quote("STANDARD", first, second),
    quote("EXPRESS", first, second),
    quote("SAME_DAY", first, first),
  ]);
  return results.filter((r): r is PriceExample => r !== null);
}

const SERVICES: readonly ServiceType[] = ["STANDARD", "EXPRESS", "SAME_DAY"];

/**
 * Which services are quoted for a parcel that stays inside each zone (zone id → services), from real
 * estimates: a 422 means no rule exists for that service there (Same day is not offered everywhere).
 * Throws when a check fails for another reason (never cached), and the caller then shows no badges
 * rather than wrong ones. Cached for hours: one quote per zone and service, six at a time.
 */
export async function getZoneServices(zoneIds: readonly string[]): Promise<Record<string, ServiceType[]>> {
  "use cache";
  cacheLife("hours");
  cacheTag("pricing");
  const jobs = zoneIds.flatMap((zoneId) => SERVICES.map((serviceType) => ({ zoneId, serviceType })));
  const offered: Record<string, ServiceType[]> = Object.fromEntries(zoneIds.map((id) => [id, []]));
  for (let i = 0; i < jobs.length; i += 6) {
    await Promise.all(
      jobs.slice(i, i + 6).map(async ({ zoneId, serviceType }) => {
        try {
          await serverFetch<PriceEstimate>(endpoints.pricing.estimate, {
            method: "POST",
            auth: false,
            body: { weightLb: PRICE_EXAMPLE_WEIGHT_LB, serviceType, originZoneId: zoneId, destinationZoneId: zoneId },
          });
          offered[zoneId].push(serviceType);
        } catch (error) {
          if (!(ApiError.isApiError(error) && error.status === 422)) throw error;
        }
      }),
    );
  }
  for (const id of zoneIds) offered[id].sort((a, b) => SERVICES.indexOf(a) - SERVICES.indexOf(b));
  return offered;
}

export type TrackingLookup = { status: "found"; data: TrackingInfo } | { status: "not-found" } | { status: "invalid" };

/** Live status (not cached: it changes as the parcel moves). Unknown and malformed ids are results, not errors. */
export async function getTracking(trackingId: string): Promise<TrackingLookup> {
  try {
    const { data } = await serverFetch<TrackingInfo>(endpoints.tracking.detail(trackingId), { auth: false });
    return { status: "found", data };
  } catch (error) {
    if (ApiError.isApiError(error) && error.status === 404) return { status: "not-found" };
    if (ApiError.isApiError(error) && error.status === 400) return { status: "invalid" };
    throw error;
  }
}
