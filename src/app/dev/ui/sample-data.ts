// TEMPORARY sample rows for /dev/ui only (shapes match src/types; values mirror the API's seed data).
import type { ShipmentListItem, StatusHistoryEntry, TrackingEvent } from "@/types";

const north = { id: "z-n", name: "Dhaka North", code: "DHK-N" };
const south = { id: "z-s", name: "Dhaka South", code: "DHK-S" };
const northHub = { id: "h-n", name: "Dhaka North Hub", code: "HUB-DHK-N", city: "Dhaka" };
const southHub = { id: "h-s", name: "Dhaka South Hub", code: "HUB-DHK-S", city: "Dhaka" };
const customer = { id: "c-1", name: "Ayesha Customer" };
const courier = { id: "r-1", name: "Rahim Courier" };

const base = {
  serviceType: "STANDARD",
  senderName: "Ayesha Customer",
  pickupAddress: "House 10, Road 3, Sector 7, Uttara, Dhaka",
  currency: "usd",
  originZone: north,
  originHub: northHub,
  customer,
} as const;

export const SAMPLE_SHIPMENTS: ShipmentListItem[] = [
  {
    ...base,
    id: "s-1",
    trackingId: "CRV-261101-SEED05",
    status: "IN_TRANSIT",
    paymentStatus: "PAID",
    serviceType: "EXPRESS",
    receiverName: "Nusrat Jahan",
    receiverPhone: "+8801811000005",
    deliveryAddress: "House 5, Road 27, Dhanmondi, Dhaka",
    weightKg: "2.3",
    price: "6.00",
    destinationZone: south,
    destinationHub: southHub,
    courier,
    createdAt: "2026-11-01T16:49:16.810Z",
    updatedAt: "2026-11-02T08:10:00.000Z",
  },
  {
    ...base,
    id: "s-2",
    trackingId: "CRV-261101-SEED10",
    status: "PENDING",
    paymentStatus: "UNPAID",
    receiverName: "Shirin Akhter",
    receiverPhone: "+8801811000010",
    deliveryAddress: "Road 12, Sector 10, Uttara, Dhaka",
    weightKg: "1.5",
    price: "3.25",
    destinationZone: north,
    destinationHub: northHub,
    courier: null,
    createdAt: "2026-11-06T02:48:12.644Z",
    updatedAt: "2026-11-06T02:48:12.644Z",
  },
  {
    ...base,
    id: "s-3",
    trackingId: "CRV-261101-SEED02",
    status: "DELIVERED",
    paymentStatus: "PAID",
    serviceType: "SAME_DAY",
    receiverName: "Imran Hossain",
    receiverPhone: "+8801811000002",
    deliveryAddress: "Flat 3B, Road 11, Banani, Dhaka",
    weightKg: "1",
    price: "4.50",
    destinationZone: north,
    destinationHub: northHub,
    courier,
    createdAt: "2026-11-05T00:48:12.610Z",
    updatedAt: "2026-11-06T04:48:20.997Z",
  },
];

export const SAMPLE_HISTORY: StatusHistoryEntry[] = [
  { id: "e1", fromStatus: null, toStatus: "PENDING", note: "Shipment created", hub: northHub, changedBy: { id: "c-1", name: "Ayesha Customer", role: "CUSTOMER" }, createdAt: "2026-11-01T16:49:16.810Z" },
  { id: "e2", fromStatus: "PENDING", toStatus: "PICKUP_SCHEDULED", note: "Call before coming", hub: null, changedBy: { id: "c-1", name: "Ayesha Customer", role: "CUSTOMER" }, createdAt: "2026-11-01T18:49:16.810Z" },
  { id: "e3", fromStatus: "PICKUP_SCHEDULED", toStatus: "COURIER_ASSIGNED", note: "Morning route", hub: null, changedBy: { id: "a-1", name: "Carrivo Admin", role: "ADMIN" }, createdAt: "2026-11-02T02:10:00.000Z" },
  { id: "e4", fromStatus: "COURIER_ASSIGNED", toStatus: "PICKED_UP", note: "Collected from sender", hub: null, changedBy: { id: "r-1", name: "Rahim Courier", role: "COURIER" }, createdAt: "2026-11-02T04:30:00.000Z" },
  { id: "e5", fromStatus: "PICKED_UP", toStatus: "AT_ORIGIN_HUB", note: null, hub: northHub, changedBy: { id: "a-1", name: "Carrivo Admin", role: "ADMIN" }, createdAt: "2026-11-02T06:00:00.000Z" },
  { id: "e6", fromStatus: "AT_ORIGIN_HUB", toStatus: "IN_TRANSIT", note: null, hub: null, changedBy: { id: "a-1", name: "Carrivo Admin", role: "ADMIN" }, createdAt: "2026-11-02T08:10:00.000Z" },
];

export const SAMPLE_TRACKING: TrackingEvent[] = [
  { status: "PENDING", city: "Dhaka", at: "2026-11-05T00:48:12.610Z" },
  { status: "PICKED_UP", city: null, at: "2026-11-05T07:30:00.000Z" },
  { status: "OUT_FOR_DELIVERY", city: null, at: "2026-11-06T03:40:00.000Z" },
  { status: "DELIVERED", city: null, at: "2026-11-06T04:48:21.001Z" },
];

export const SAMPLE_SHIPMENTS_PER_DAY = [3, 5, 4, 6, 2, 7, 5, 9, 6, 4, 8, 7, 5, 6].map((value, i) => ({
  label: `${i + 24 > 31 ? i - 7 : i + 24} ${i + 24 > 31 ? "Nov" : "Oct"}`,
  value,
}));
