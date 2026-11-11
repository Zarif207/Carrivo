/**
 * Enum values used by the Carrivo API (see docs/API_CONTRACT.md → "Enums").
 * Each enum is a readonly tuple so it can drive both TypeScript unions and Zod (`z.enum(SHIPMENT_STATUSES)`).
 */

export const ROLES = ["CUSTOMER", "COURIER", "ADMIN", "ADMIN_VIEWER"] as const;
export type Role = (typeof ROLES)[number];

export const USER_STATUSES = ["ACTIVE", "INACTIVE"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

/** Ordered as the shipment normally moves (CANCELLED / RETURNED / FAILED_DELIVERY are side exits). */
export const SHIPMENT_STATUSES = [
  "PENDING",
  "PICKUP_SCHEDULED",
  "COURIER_ASSIGNED",
  "PICKED_UP",
  "AT_ORIGIN_HUB",
  "IN_TRANSIT",
  "AT_DESTINATION_HUB",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "FAILED_DELIVERY",
  "RETURNED",
  "CANCELLED",
] as const;
export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

/** `shipment.paymentStatus` (not the same set as a Payment row's status). */
export const SHIPMENT_PAYMENT_STATUSES = ["UNPAID", "PAID", "REFUNDED"] as const;
export type ShipmentPaymentStatus = (typeof SHIPMENT_PAYMENT_STATUSES)[number];

/** `payment.status` (one row per Stripe Checkout attempt). */
export const PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED", "EXPIRED", "REFUND_PENDING", "REFUNDED"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const SERVICE_TYPES = ["STANDARD", "EXPRESS", "SAME_DAY"] as const;
export type ServiceType = (typeof SERVICE_TYPES)[number];

export const VEHICLE_TYPES = ["BICYCLE", "MOTORCYCLE", "CAR", "VAN", "TRUCK"] as const;
export type VehicleType = (typeof VEHICLE_TYPES)[number];

/** A customer's request to become a courier (CANCELLED = withdrawn by the applicant). */
export const COURIER_APPLICATION_STATUSES = ["PENDING", "APPROVED", "REJECTED", "CANCELLED"] as const;
export type CourierApplicationStatus = (typeof COURIER_APPLICATION_STATUSES)[number];

export const WORK_AVAILABILITIES = ["WEEKDAYS", "WEEKENDS", "FULL_TIME"] as const;
export type WorkAvailability = (typeof WORK_AVAILABILITIES)[number];

export const PICKUP_STATUSES = ["SCHEDULED", "COMPLETED", "CANCELLED"] as const;
export type PickupStatus = (typeof PICKUP_STATUSES)[number];

export const EARNING_STATUSES = ["PENDING", "PAID"] as const;
export type EarningStatus = (typeof EARNING_STATUSES)[number];

export const NOTIFICATION_TYPES = [
  "SHIPMENT_CREATED",
  "COURIER_ASSIGNED",
  "PICKED_UP",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "FAILED_DELIVERY",
  "PAYMENT_RECEIVED",
  "REFUND_COMPLETED",
  // Staff only (ADMIN and ADMIN_VIEWER feed)
  "SHIPMENT_CANCELLED",
  "PAYMENT_FAILED",
  "REFUND_FAILED",
  "ZONE_CHANGED",
  "HUB_CHANGED",
  "COURIER_ADDED",
  "COURIER_APPLICATION_SUBMITTED",
  // To the applicant
  "COURIER_APPLICATION_APPROVED",
  "COURIER_APPLICATION_REJECTED",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const AUDIT_ENTITY_TYPES = ["ZONE", "HUB", "PRICING_RULE", "SHIPMENT", "COURIER_PROFILE", "USER", "PAYMENT", "COURIER_APPLICATION"] as const;
export type AuditEntityType = (typeof AUDIT_ENTITY_TYPES)[number];

export const AUDIT_ACTIONS = [
  "ZONE_CREATED",
  "ZONE_UPDATED",
  "ZONE_DELETED",
  "HUB_CREATED",
  "HUB_UPDATED",
  "HUB_DELETED",
  "PRICING_RULE_CREATED",
  "PRICING_RULE_UPDATED",
  "PRICING_RULE_DELETED",
  "SHIPMENT_CREATED",
  "SHIPMENT_UPDATED",
  "SHIPMENT_STATUS_CHANGED",
  "SHIPMENT_DELETED",
  "SHIPMENT_PICKUP_SCHEDULED",
  "SHIPMENT_ASSIGNED",
  "SHIPMENT_UNASSIGNED",
  "SHIPMENT_PROOF_UPLOADED",
  "COURIER_AVAILABILITY_CHANGED",
  "DEV_MARK_PAID",
  "USER_CREATED",
  "USER_REGISTERED",
  "USER_PROFILE_UPDATED",
  "USER_ROLE_CHANGED",
  "USER_STATUS_CHANGED",
  "USER_REGISTERED_GOOGLE",
  "USER_LOGIN_GOOGLE",
  "USER_LOGIN_REFUSED",
  "USER_PASSWORD_RESET_BY_SEED",
  "PAYMENT_INITIATED",
  "PAYMENT_PAID",
  "PAYMENT_EXPIRED",
  "PAYMENT_FAILED",
  "PAYMENT_REVIEW_REQUIRED",
  "PAYMENT_REFUND_REQUESTED",
  "PAYMENT_REFUNDED",
  "PAYMENT_REFUND_FAILED",
  "COURIER_APPLICATION_SUBMITTED",
  "COURIER_APPLICATION_CANCELLED",
  "COURIER_APPLICATION_APPROVED",
  "COURIER_APPLICATION_REJECTED",
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

/** The only `?error=` values the API sends to /auth/google/callback. */
export const GOOGLE_AUTH_ERRORS = ["account_exists", "account_deactivated", "google_cancelled", "google_failed"] as const;
export type GoogleAuthError = (typeof GOOGLE_AUTH_ERRORS)[number];

export const SORT_ORDERS = ["asc", "desc"] as const;
export type SortOrder = (typeof SORT_ORDERS)[number];

/* ── Shipment state machine (mirrors the backend's shipment.constants.ts) ── */

/** Targets accepted by PATCH /shipments/:id/status. Pickup, assign, unassign and cancel have their own endpoints. */
export const STATUS_UPDATE_TARGETS = [
  "PICKED_UP",
  "AT_ORIGIN_HUB",
  "IN_TRANSIT",
  "AT_DESTINATION_HUB",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "FAILED_DELIVERY",
  "RETURNED",
] as const satisfies readonly ShipmentStatus[];
export type StatusUpdateTarget = (typeof STATUS_UPDATE_TARGETS)[number];

/** `TRANSITIONS[from][to]` = roles allowed to make that move. */
export const SHIPMENT_TRANSITIONS: Readonly<Record<ShipmentStatus, Partial<Record<ShipmentStatus, readonly Role[]>>>> = {
  PENDING: { PICKUP_SCHEDULED: ["CUSTOMER"], CANCELLED: ["CUSTOMER", "ADMIN"] },
  PICKUP_SCHEDULED: { COURIER_ASSIGNED: ["ADMIN"], CANCELLED: ["CUSTOMER", "ADMIN"] },
  COURIER_ASSIGNED: { PICKED_UP: ["COURIER"], PICKUP_SCHEDULED: ["ADMIN"], CANCELLED: ["CUSTOMER", "ADMIN"] },
  PICKED_UP: { AT_ORIGIN_HUB: ["ADMIN"] },
  AT_ORIGIN_HUB: { IN_TRANSIT: ["ADMIN"] },
  IN_TRANSIT: { AT_DESTINATION_HUB: ["ADMIN"] },
  AT_DESTINATION_HUB: { OUT_FOR_DELIVERY: ["ADMIN"] },
  OUT_FOR_DELIVERY: { DELIVERED: ["COURIER"], FAILED_DELIVERY: ["COURIER"] },
  FAILED_DELIVERY: { OUT_FOR_DELIVERY: ["COURIER"], RETURNED: ["ADMIN"] },
  DELIVERED: {},
  RETURNED: {},
  CANCELLED: {},
};

/** After this many failed attempts only RETURNED (admin) is allowed. */
export const MAX_DELIVERY_ATTEMPTS = 3;

export const CANCELLABLE_STATUSES = ["PENDING", "PICKUP_SCHEDULED", "COURIER_ASSIGNED"] as const satisfies readonly ShipmentStatus[];
export const TERMINAL_STATUSES = ["DELIVERED", "RETURNED", "CANCELLED"] as const satisfies readonly ShipmentStatus[];
/** Statuses a courier's task can be in (assignment onwards); GET /couriers/me/tasks filters by any of them. */
export const COURIER_TASK_STATUSES = [
  "COURIER_ASSIGNED",
  "PICKED_UP",
  "AT_ORIGIN_HUB",
  "IN_TRANSIT",
  "AT_DESTINATION_HUB",
  "OUT_FOR_DELIVERY",
  "FAILED_DELIVERY",
  "DELIVERED",
  "RETURNED",
  "CANCELLED",
] as const satisfies readonly ShipmentStatus[];
/** Statuses that accept an optional `hubId` on PATCH /status. */
export const HUB_STATUSES = ["AT_ORIGIN_HUB", "AT_DESTINATION_HUB"] as const satisfies readonly ShipmentStatus[];

/** Next statuses `role` may move a shipment to (UI hint only; the API is the authority). */
export function getAllowedNextStatuses(from: ShipmentStatus, failedAttempts: number, role: Role): ShipmentStatus[] {
  const targets = SHIPMENT_TRANSITIONS[from];
  return SHIPMENT_STATUSES.filter((to) => {
    const roles = targets[to];
    if (!roles || !roles.includes(role)) return false;
    if (from === "FAILED_DELIVERY" && to === "OUT_FOR_DELIVERY") return failedAttempts < MAX_DELIVERY_ATTEMPTS;
    return true;
  });
}
