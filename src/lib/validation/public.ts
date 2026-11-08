import { z } from "zod";
import { SERVICE_TYPES } from "@/types";
import { MAX_WEIGHT_LB } from "@/lib/weight";

/* Zod rules for the public forms. They mirror the API's validation (docs/API_CONTRACT.md). */

/** CRV-YYMMDD-XXXXXX, case-insensitive (the API upper-cases on lookup). */
export const TRACKING_ID_PATTERN = /^CRV-\d{6}-[A-Z0-9]{6}$/i;

export const normalizeTrackingId = (value: string): string => value.trim().toUpperCase();

export const trackingSchema = z.object({
  trackingId: z
    .string()
    .trim()
    .min(1, "Enter a tracking ID")
    .regex(TRACKING_ID_PATTERN, "Tracking IDs look like CRV-261101-SEED05"),
});
export type TrackingValues = z.infer<typeof trackingSchema>;

/** POST /pricing/estimate: weight > 0, ≤ 2,000 lb, rounded to 2 decimals by the API. */
export const estimateSchema = z.object({
  originZoneId: z.uuid("Choose where the parcel starts"),
  destinationZoneId: z.uuid("Choose where it's going"),
  weightLb: z
    .number({ error: "Enter the weight in pounds" })
    .positive("Weight must be more than 0 lb")
    .max(MAX_WEIGHT_LB, "Weight can't be more than 2,000 lb"),
  serviceType: z.enum(SERVICE_TYPES, { error: "Choose a service" }),
});
export type EstimateValues = z.infer<typeof estimateSchema>;
export type EstimateFormValues = z.input<typeof estimateSchema>;

export const CONTACT_TOPICS = [
  { value: "booking", label: "Booking a shipment" },
  { value: "tracking", label: "A parcel on the way" },
  { value: "payment", label: "Payments and refunds" },
  { value: "business", label: "Regular shipping for a business" },
  { value: "other", label: "Something else" },
] as const;

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.email("Enter a valid email address").trim(),
  topic: z.enum(CONTACT_TOPICS.map((t) => t.value) as [string, ...string[]], { error: "Choose a topic" }),
  trackingId: z
    .string()
    .trim()
    .refine((value) => value === "" || TRACKING_ID_PATTERN.test(value), "Tracking IDs look like CRV-261101-SEED05")
    .optional(),
  message: z.string().trim().min(10, "Tell us a little more (at least 10 characters)").max(1500, "Keep it under 1500 characters"),
});
export type ContactValues = z.infer<typeof contactSchema>;
