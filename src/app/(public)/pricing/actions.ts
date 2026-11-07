"use server";

import { headers } from "next/headers";
import { getClientIp } from "@/lib/api/client-ip";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { serverFetch } from "@/lib/api/server";
import { estimateSchema } from "@/lib/validation/public";
import type { PriceEstimate } from "@/types";

export type EstimateResult =
  | { ok: true; estimate: PriceEstimate }
  | { ok: false; message: string; fieldErrors?: Record<string, string>; kind: "validation" | "unavailable" | "error" };

/** Quote a price with POST /pricing/estimate (public). Expected failures are returned, not thrown. */
export async function estimatePrice(input: unknown): Promise<EstimateResult> {
  const parsed = estimateSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "");
      if (key && !(key in fieldErrors)) fieldErrors[key] = issue.message;
    }
    return { ok: false, kind: "validation", message: "Check the highlighted fields.", fieldErrors };
  }

  try {
    const { data } = await serverFetch<PriceEstimate>(endpoints.pricing.estimate, {
      method: "POST",
      auth: false,
      clientIp: getClientIp(await headers()) ?? false,
      body: parsed.data,
    });
    return { ok: true, estimate: data };
  } catch (error) {
    if (ApiError.isApiError(error)) {
      // 422: no rule for this service on this route, or over the rule's max weight.
      if (error.status === 422) return { ok: false, kind: "unavailable", message: error.message, fieldErrors: error.fieldErrors() };
      if (error.status === 400) return { ok: false, kind: "validation", message: error.message, fieldErrors: error.fieldErrors() };
      if (error.status === 429) return { ok: false, kind: "error", message: "Too many quotes in a short time. Wait a minute and try again." };
      return { ok: false, kind: "error", message: error.isNetworkError ? error.message : "Pricing is unavailable right now. Try again in a moment." };
    }
    return { ok: false, kind: "error", message: "Pricing is unavailable right now. Try again in a moment." };
  }
}
