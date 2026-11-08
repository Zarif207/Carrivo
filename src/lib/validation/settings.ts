import { z } from "zod";
import { SERVICE_TYPES } from "@/types";
import { MAX_WEIGHT_LB } from "@/lib/weight";

/* Admin settings forms. Rules mirror the API's zone / hub / pricing validators (contract §7). */

const optionalText = (max: number, message: string) => z.string().trim().max(max, message);

export const zoneSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Keep it under 100 characters"),
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9-]{2,20}$/, "2-20 letters, digits or dashes, e.g. DHK-N"),
  description: optionalText(500, "Keep it under 500 characters"),
  isActive: z.boolean(),
});
export type ZoneValues = z.input<typeof zoneSchema>;

export const hubSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Keep it under 100 characters"),
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9-]{2,30}$/, "2-30 letters, digits or dashes, e.g. HUB-DHK-N"),
  address: z.string().trim().min(3, "At least 3 characters").max(300, "Keep it under 300 characters"),
  city: z.string().trim().min(2, "At least 2 characters").max(100, "Keep it under 100 characters"),
  phone: z
    .string()
    .trim()
    .refine((v) => v === "" || /^\+?[0-9\s-]{7,20}$/.test(v), "7-20 digits, optionally with +, spaces or dashes"),
  zoneId: z.uuid("Choose the zone this hub serves"),
  isActive: z.boolean(),
});
export type HubValues = z.input<typeof hubSchema>;

const money = (label: string) =>
  z
    .number({ error: `Enter the ${label}` })
    .min(0, "Must be 0 or more")
    .max(99_999_999, "That amount is too large");

/** "" in a zone select = the service's default rule (both zones null). */
export const pricingSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Keep it under 100 characters"),
    serviceType: z.enum(SERVICE_TYPES, { error: "Choose a service" }),
    originZoneId: z.string(),
    destinationZoneId: z.string(),
    baseFee: money("base fee"),
    baseWeightLb: z.number({ error: "Enter the weight the base fee covers" }).min(0, "Must be 0 or more").max(MAX_WEIGHT_LB, "At most 2,000 lb"),
    perLbFee: money("fee per extra lb"),
    maxWeightLb: z.number().positive("Must be more than 0").max(MAX_WEIGHT_LB, "At most 2,000 lb").optional(),
    isActive: z.boolean(),
  })
  .refine((v) => (v.originZoneId === "") === (v.destinationZoneId === ""), {
    message: "Pick both zones for a route rule, or neither for the default rule",
    path: ["destinationZoneId"],
  })
  .refine((v) => v.maxWeightLb === undefined || v.maxWeightLb >= v.baseWeightLb, {
    message: "The weight cap must be at least the base weight",
    path: ["maxWeightLb"],
  });
export type PricingValues = z.input<typeof pricingSchema>;
