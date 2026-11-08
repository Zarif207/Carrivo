import { z } from "zod";
import { SERVICE_TYPES } from "@/types";
import { MAX_WEIGHT_LB } from "@/lib/weight";
import { usAddress, usPhone } from "./us";

/*
 * New-shipment wizard, one schema per step. Rules mirror POST /shipments (contract §5):
 * names 2-100, US phones, US addresses (street, city, state, ZIP; sent as one line), receiver email
 * optional, description ≤ 500, declared value 0-99,999,999, weight > 0 and ≤ 2,000 lb, UUID zones and hubs.
 */

const name = z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name can be at most 100 characters");
const phone = usPhone;
const address = usAddress;

export const contactStepSchema = z.object({
  senderName: name,
  senderPhone: phone,
  pickupAddress: address,
  receiverName: name,
  receiverPhone: phone,
  receiverEmail: z.union([z.literal(""), z.email("Enter a valid email or leave it empty").trim()]),
  deliveryAddress: address,
});
export type ContactStep = z.infer<typeof contactStepSchema>;

export const parcelStepSchema = z.object({
  originZoneId: z.uuid("Choose the pickup zone"),
  originHubId: z.uuid("Choose the pickup hub"),
  destinationZoneId: z.uuid("Choose the delivery zone"),
  destinationHubId: z.uuid("Choose the delivery hub"),
  weightLb: z.number({ error: "Enter the weight in pounds" }).positive("Weight must be more than 0 lb").max(MAX_WEIGHT_LB, "Weight can't be more than 2,000 lb"),
  serviceType: z.enum(SERVICE_TYPES, { error: "Choose a service" }),
  description: z.string().trim().max(500, "Keep it under 500 characters"),
  declaredValue: z.number().min(0, "Must be 0 or more").max(99_999_999, "That value is too large").optional(),
  isFragile: z.boolean(),
});
export type ParcelStep = z.infer<typeof parcelStepSchema>;
export type ParcelStepInput = z.input<typeof parcelStepSchema>;

export type ShipmentDraft = ContactStep & ParcelStep;

/** Which step owns each API field, to send server-side errors back to the right place. */
export const FIELD_STEP: Record<string, 1 | 2> = {
  senderName: 1,
  senderPhone: 1,
  pickupAddress: 1,
  receiverName: 1,
  receiverPhone: 1,
  receiverEmail: 1,
  deliveryAddress: 1,
  originZoneId: 2,
  originHubId: 2,
  destinationZoneId: 2,
  destinationHubId: 2,
  weightLb: 2,
  serviceType: 2,
  description: 2,
  declaredValue: 2,
  isFragile: 2,
};
