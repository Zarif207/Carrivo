"use client";

import { useQuery } from "@tanstack/react-query";
import { estimatePrice } from "@/app/(public)/pricing/actions";
import { ApiError } from "@/lib/api/errors";
import { queryKeys } from "@/lib/api/query-keys";
import type { PriceEstimate, PriceEstimateInput, ServiceType } from "@/types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface EstimateFields {
  originZoneId?: string;
  destinationZoneId?: string;
  weightKg?: number;
  serviceType?: ServiceType;
}

/** The complete estimate input, or null while something is missing or out of range. */
export function toEstimateInput(fields: EstimateFields): PriceEstimateInput | null {
  const { originZoneId, destinationZoneId, weightKg, serviceType } = fields;
  if (!originZoneId || !destinationZoneId || !UUID.test(originZoneId) || !UUID.test(destinationZoneId)) return null;
  if (typeof weightKg !== "number" || !Number.isFinite(weightKg) || weightKg <= 0 || weightKg > 1000 || !serviceType) return null;
  return { originZoneId, destinationZoneId, weightKg: Math.round(weightKg * 100) / 100, serviceType };
}

/**
 * Live quote from POST /pricing/estimate (public), cached per input, via the estimatePrice server
 * action: "not offered on this route" (422) is an expected answer, so it comes back as a result
 * instead of a failed network request in the console. Errors are rethrown as ApiError here.
 */
export function useEstimate(input: PriceEstimateInput | null) {
  return useQuery({
    queryKey: input ? queryKeys.pricing.estimate(input) : ["pricing", "estimate", "incomplete"],
    queryFn: async (): Promise<PriceEstimate> => {
      const result = await estimatePrice(input);
      if (result.ok) return result.estimate;
      const status = result.kind === "unavailable" ? 422 : result.kind === "validation" ? 400 : 502;
      const errors = Object.entries(result.fieldErrors ?? {}).map(([name, message]) => ({ path: `body.${name}`, message }));
      throw new ApiError(status, result.message, errors);
    },
    enabled: input !== null,
    staleTime: 5 * 60_000,
    retry: false,
  });
}
