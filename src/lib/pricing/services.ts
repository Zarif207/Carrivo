import type { ServiceType } from "@/types";

/*
 * Service picker rules shared by the price calculator and the booking wizard (plain module: safe in
 * Server and Client Components). The API is the authority; these rules only steer the UI so a
 * visitor isn't offered a quote the API will refuse.
 */

export const SERVICE_OPTIONS = [
  { value: "STANDARD", label: "Standard" },
  { value: "EXPRESS", label: "Express" },
  { value: "SAME_DAY", label: "Same day" },
] as const satisfies readonly { value: ServiceType; label: string }[];

export const SERVICE_HINTS: Record<ServiceType, string> = {
  STANDARD: "The everyday option for parcels that aren't urgent.",
  EXPRESS: "Faster and higher priced, for parcels that need to arrive sooner.",
  SAME_DAY: "Picked up and delivered the same day, within one zone only.",
};

export const serviceLabel = (value: ServiceType): string => SERVICE_OPTIONS.find((o) => o.value === value)?.label ?? value;

/** Shown under the service picker while Same day is unavailable. */
export const SAME_DAY_REASON =
  "Same-day delivery runs inside one zone. Choose the same zone for pickup and delivery, or pick Standard or Express.";

/** Shown once Same day was replaced because the zones stopped matching. */
export const SAME_DAY_SWITCHED = "Same day isn't offered between two zones, so Express is selected instead.";

/** Same day needs pickup and delivery in one zone. Until both zones are chosen, it stays available. */
export const sameDayAllowed = (originZoneId?: string, destinationZoneId?: string): boolean =>
  !originZoneId || !destinationZoneId || originZoneId === destinationZoneId;

export interface PriceContext {
  serviceType?: ServiceType;
  originZoneId?: string;
  destinationZoneId?: string;
  originName?: string;
  destinationName?: string;
}

export interface PriceProblem {
  title: string;
  message: string;
  /** The form field the problem belongs to. */
  field: "weightLb" | "serviceType";
}

const pounds = (value: number): string => (Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0$/, ""));

/**
 * Turns the API's 422 for POST /pricing/estimate into a specific message. The API answers
 * "Weight exceeds the 20.00 lb limit for SAME_DAY" (the limit comes from the rule, so it is read
 * from the message, never hard-coded here) or "No pricing available for this service and route".
 */
export function describePriceProblem(apiMessage: string, context: PriceContext): PriceProblem {
  const service = context.serviceType ? serviceLabel(context.serviceType) : "This service";
  const limit = /exceeds the ([\d.]+) lb limit/i.exec(apiMessage);
  if (limit) {
    return {
      title: `Too heavy for ${service}`,
      message: `${service} takes parcels up to ${pounds(Number(limit[1]))} lb. Choose another service, or split the parcel.`,
      field: "weightLb",
    };
  }
  if (context.serviceType === "SAME_DAY" && !sameDayAllowed(context.originZoneId, context.destinationZoneId)) {
    return { title: "Same day works inside one zone", message: SAME_DAY_REASON, field: "serviceType" };
  }
  if (/no pricing available/i.test(apiMessage)) {
    const route = context.originName && context.destinationName ? ` from ${context.originName} to ${context.destinationName}` : " on this route";
    return {
      title: "No price for this route yet",
      message: `There's no ${service} price${route} yet. Try another service, or contact us for a quote.`,
      field: "serviceType",
    };
  }
  return { title: "Not available", message: apiMessage, field: "serviceType" };
}
