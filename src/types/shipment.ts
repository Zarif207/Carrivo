import type {
  ActorRef,
  Currency,
  DateFilter,
  DecimalString,
  HubRef,
  ISODateString,
  Id,
  ListQuery,
  Money,
  PersonRef,
  ZoneRef,
} from "./common";
import type {
  PickupStatus,
  ServiceType,
  ShipmentPaymentStatus,
  ShipmentStatus,
  StatusUpdateTarget,
} from "./enums";
import type { PriceBreakdown } from "./location";

/** Row shape of GET /shipments (role-scoped list). */
export interface ShipmentListItem {
  id: Id;
  /** CRV-YYMMDD-XXXXXX */
  trackingId: string;
  status: ShipmentStatus;
  paymentStatus: ShipmentPaymentStatus;
  serviceType: ServiceType;
  senderName: string;
  receiverName: string;
  receiverPhone: string;
  pickupAddress: string;
  deliveryAddress: string;
  weightLb: DecimalString;
  price: Money;
  currency: Currency;
  originZone: ZoneRef;
  destinationZone: ZoneRef;
  originHub: HubRef;
  destinationHub: HubRef;
  customer: PersonRef;
  courier: PersonRef | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface PickupRequest {
  scheduledAt: ISODateString;
  scheduledUntil: ISODateString;
  pickupAddress: string;
  contactName: string;
  contactPhone: string;
  notes: string | null;
  status: PickupStatus;
  completedAt: ISODateString | null;
}

/** One row of the status timeline (oldest first). */
export interface StatusHistoryEntry {
  id: Id;
  fromStatus: ShipmentStatus | null;
  toStatus: ShipmentStatus;
  note: string | null;
  hub: HubRef | null;
  /** Typed nullable defensively; every documented example has an actor. */
  changedBy: ActorRef | null;
  createdAt: ISODateString;
}

/** GET /shipments/:id and every shipment mutation response. */
export interface ShipmentDetail extends Omit<ShipmentListItem, "courier"> {
  courier: (PersonRef & { phone: string | null }) | null;
  senderPhone: string;
  receiverEmail: string | null;
  description: string | null;
  declaredValue: Money | null;
  isFragile: boolean;
  priceBreakdown: PriceBreakdown;
  failedAttempts: number;
  failureReason: string | null;
  cancelReason: string | null;
  /** Owner, admin and assigned courier only; never in public tracking. */
  proofOfDeliveryUrl: string | null;
  proofOfDeliveryUploadedAt: ISODateString | null;
  estimatedDeliveryAt: ISODateString | null;
  pickedUpAt: ISODateString | null;
  deliveredAt: ISODateString | null;
  cancelledAt: ISODateString | null;
  currentHub: HubRef | null;
  pickupRequest: PickupRequest | null;
  statusHistory: StatusHistoryEntry[];
}

/** data of DELETE /shipments/:id */
export interface DeletedShipment {
  id: Id;
  trackingId: string;
  deletedAt: ISODateString;
}

export type ShipmentSortBy = "createdAt" | "updatedAt" | "price" | "weightLb" | "status" | "trackingId";

/** searchTerm matches trackingId, receiver name or receiver phone. */
export type ShipmentListQuery = ListQuery<ShipmentSortBy> & {
  status?: ShipmentStatus;
  serviceType?: ServiceType;
  paymentStatus?: ShipmentPaymentStatus;
  fromDate?: DateFilter;
  toDate?: DateFilter;
  /** ADMIN only. */
  customerId?: Id;
  /** ADMIN only. */
  courierId?: Id;
};

/** POST /shipments (CUSTOMER). Strict: price/status/trackingId/customerId → 400. */
export type CreateShipmentInput = {
  senderName: string;
  senderPhone: string;
  pickupAddress: string;
  receiverName: string;
  receiverPhone: string;
  receiverEmail?: string | null;
  deliveryAddress: string;
  originZoneId: Id;
  originHubId: Id;
  destinationZoneId: Id;
  destinationHubId: Id;
  weightLb: number;
  serviceType: ServiceType;
  description?: string | null;
  declaredValue?: number | null;
  isFragile?: boolean;
};

/** PATCH /shipments/:id (owner, PENDING only). Zones/hubs are fixed; weight/service locked once PAID. */
export type UpdateShipmentInput = Partial<
  Omit<CreateShipmentInput, "originZoneId" | "originHubId" | "destinationZoneId" | "destinationHubId">
>;

/** POST /shipments/:id/cancel (body optional). */
export type CancelShipmentInput = {
  reason?: string;
};

/** POST /shipments/:id/pickup. ISO date-times with offset; start in the future, ≤ 30 days ahead, window ≤ 12 h. */
export type SchedulePickupInput = {
  windowStart: ISODateString;
  windowEnd: ISODateString;
  pickupAddress?: string;
  contactName?: string;
  contactPhone?: string;
  notes?: string;
};

/** POST /shipments/:id/assign (ADMIN). courierId = the courier's user id from GET /couriers. */
export type AssignCourierInput = {
  courierId: Id;
  note?: string;
};

/** POST /shipments/:id/unassign (ADMIN, body optional). */
export type UnassignCourierInput = {
  note?: string;
};

/** PATCH /shipments/:id/status. `note` required for FAILED_DELIVERY; `hubId` only for hub statuses. */
export type UpdateShipmentStatusInput = {
  status: StatusUpdateTarget;
  note?: string;
  hubId?: Id;
};

/* ── Public tracking ── */

export interface TrackingEvent {
  status: ShipmentStatus;
  city: string | null;
  at: ISODateString;
}

/** GET /tracking/:trackingId. No names, phones, addresses, prices or ids. */
export interface TrackingInfo {
  trackingId: string;
  status: ShipmentStatus;
  serviceType: ServiceType;
  origin: { city: string };
  destination: { city: string };
  createdAt: ISODateString;
  estimatedDeliveryAt: ISODateString | null;
  deliveredAt: ISODateString | null;
  timeline: TrackingEvent[];
}
