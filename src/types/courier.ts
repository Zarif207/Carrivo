import type { DateFilter, HubRef, ISODateString, Id, ListQuery, Money } from "./common";
import type { EarningStatus, ServiceType, ShipmentStatus } from "./enums";
import type { PickupRequest, ShipmentListItem } from "./shipment";
import type { CourierProfile } from "./user";

/** GET /couriers (ADMIN, assignment screen). `id` is the user id to send to /shipments/:id/assign. */
export interface CourierListItem {
  id: Id;
  name: string;
  email: string;
  phone: string | null;
  courierProfile: CourierProfile | null;
  activeTaskCount: number;
}

export type CourierListQuery = ListQuery<"name" | "createdAt"> & {
  zoneId?: Id;
  hubId?: Id;
  available?: "true" | "false";
};

/** GET /couriers/me/tasks row: list fields plus what the courier needs for pickup/delivery. */
export interface CourierTask extends ShipmentListItem {
  senderPhone: string;
  isFragile: boolean;
  description: string | null;
  failedAttempts: number;
  failureReason: string | null;
  proofOfDeliveryUrl: string | null;
  proofOfDeliveryUploadedAt: ISODateString | null;
  currentHub: HubRef | null;
  pickupRequest: PickupRequest | null;
}

/** Omit `status` to get active tasks (not DELIVERED / RETURNED / CANCELLED). No date filter exists. */
export type CourierTaskQuery = ListQuery<"createdAt" | "updatedAt" | "status"> & {
  status?: ShipmentStatus;
};

export interface Earning {
  id: Id;
  /** 20% of the delivered shipment's price. */
  amount: Money;
  status: EarningStatus;
  paidOutAt: ISODateString | null;
  createdAt: ISODateString;
  shipment: { id: Id; trackingId: string; serviceType: ServiceType; price: Money };
}

/** Covers the date range across all statuses (the status filter applies to `earnings` only). */
export interface EarningSummary {
  totalEarned: Money;
  pending: Money;
  paidOut: Money;
  deliveries: number;
}

/** data of GET /couriers/me/earnings (meta paginates `earnings`). */
export interface EarningsResult {
  summary: EarningSummary;
  earnings: Earning[];
}

export type EarningQuery = ListQuery<"createdAt" | "amount"> & {
  status?: EarningStatus;
  fromDate?: DateFilter;
  toDate?: DateFilter;
};

/** PATCH /couriers/me/availability → data: CourierProfile */
export type AvailabilityInput = {
  isAvailable: boolean;
};
