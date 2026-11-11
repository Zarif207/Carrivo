import { z } from "zod";
import { usPhone } from "@/lib/validation/us";
import { VEHICLE_TYPES, WORK_AVAILABILITIES } from "@/types/enums";
import type { ApproveCourierApplicationInput, CourierApplicationInput } from "@/types";

/*
 * Courier application forms. Limits mirror the API (backend docs/api.md → "Courier applications"),
 * so the form catches mistakes before the request; the API still validates everything.
 * There are deliberately no licence, SSN or government ID fields.
 */

export const APPLICATION_LIMITS = { plateMin: 2, plateMax: 20, experience: 500, about: 1000, noteMin: 5, noteMax: 500 } as const;

const PLATE = /^[A-Za-z0-9][A-Za-z0-9 -]*$/;

export const applyFormSchema = z.object({
  phone: usPhone,
  /** "" = no preference. */
  preferredZoneId: z.string(),
  vehicleType: z.enum(VEHICLE_TYPES, { error: "Choose the vehicle you'll deliver with" }),
  vehiclePlate: z
    .string()
    .trim()
    .max(APPLICATION_LIMITS.plateMax, `Plates are at most ${APPLICATION_LIMITS.plateMax} characters`)
    .refine((v) => v === "" || (v.length >= APPLICATION_LIMITS.plateMin && PLATE.test(v)), "Use letters, digits, spaces and dashes, e.g. NY KDR-5512"),
  availability: z.enum(WORK_AVAILABILITIES, { error: "Choose when you can work" }),
  experience: z.string().trim().max(APPLICATION_LIMITS.experience, `Keep it under ${APPLICATION_LIMITS.experience} characters`),
  about: z.string().trim().max(APPLICATION_LIMITS.about, `Keep it under ${APPLICATION_LIMITS.about} characters`),
  consent: z.literal(true, { error: "Tick the box to confirm before you apply" }),
});

export type ApplyFormValues = z.input<typeof applyFormSchema>;

export const APPLY_FORM_DEFAULTS = {
  phone: "",
  preferredZoneId: "",
  vehiclePlate: "",
  experience: "",
  about: "",
} satisfies Partial<ApplyFormValues>;

const orNull = (value: string): string | null => (value.trim() ? value.trim() : null);

/** Form values → POST /courier-applications body (empty optional fields become null). */
export function toApplyBody(values: z.output<typeof applyFormSchema>): CourierApplicationInput {
  return {
    phone: values.phone.trim(),
    vehicleType: values.vehicleType,
    availability: values.availability,
    preferredZoneId: values.preferredZoneId || null,
    vehiclePlate: values.vehiclePlate ? values.vehiclePlate.toUpperCase() : null,
    experience: orNull(values.experience),
    about: orNull(values.about),
  };
}

export const rejectFormSchema = z.object({
  note: z
    .string()
    .trim()
    .min(APPLICATION_LIMITS.noteMin, `Write at least ${APPLICATION_LIMITS.noteMin} characters: the applicant sees this reason`)
    .max(APPLICATION_LIMITS.noteMax, `Keep the note under ${APPLICATION_LIMITS.noteMax} characters`),
});

export type RejectFormValues = z.input<typeof rejectFormSchema>;

/** The zone is required (prefilled with the applicant's preferred zone); the hub is optional. */
export const approveFormSchema = z.object({
  zoneId: z.string().min(1, "Choose the zone this courier will work in"),
  /** "" = no hub. */
  hubId: z.string(),
});

export type ApproveFormValues = z.input<typeof approveFormSchema>;

export const toApproveBody = (values: ApproveFormValues): ApproveCourierApplicationInput => ({
  zoneId: values.zoneId,
  ...(values.hubId ? { hubId: values.hubId } : {}),
});
