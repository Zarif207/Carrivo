/*
 * Sample values for the illustrative dashboard preview on the home page. They are typed with the
 * API's own shapes and mirror the seeded data (zones, hubs, prices, tracking ids), but they are a
 * picture of the product, not live data, and the preview says so.
 */
import type { ShipmentListItem } from "@/types";

const north = { id: "z-n", name: "Dhaka North", code: "DHK-N" };
const south = { id: "z-s", name: "Dhaka South", code: "DHK-S" };
const northHub = { id: "h-n", name: "Dhaka North Hub", code: "HUB-DHK-N", city: "Dhaka" };
const southHub = { id: "h-s", name: "Dhaka South Hub", code: "HUB-DHK-S", city: "Dhaka" };
const customer = { id: "c-1", name: "Ayesha Rahman" };

const base = {
  senderName: "Ayesha Rahman",
  pickupAddress: "House 10, Road 3, Sector 7, Uttara",
  currency: "usd",
  originZone: north,
  originHub: northHub,
  customer,
  courier: { id: "r-1", name: "Rahim" },
} as const;

export const PREVIEW_SHIPMENTS: ShipmentListItem[] = [
  {
    ...base,
    id: "p-1",
    trackingId: "CRV-261101-SEED05",
    status: "IN_TRANSIT",
    paymentStatus: "PAID",
    serviceType: "EXPRESS",
    receiverName: "Nusrat Jahan",
    receiverPhone: "+8801811000005",
    deliveryAddress: "House 5, Road 27, Dhanmondi",
    weightKg: "2.3",
    price: "6.50",
    destinationZone: south,
    destinationHub: southHub,
    createdAt: "2026-11-02T16:45:49.827Z",
    updatedAt: "2026-11-03T02:45:49.827Z",
  },
  {
    ...base,
    id: "p-2",
    trackingId: "CRV-261104-K7Q2PD",
    status: "OUT_FOR_DELIVERY",
    paymentStatus: "PAID",
    serviceType: "SAME_DAY",
    receiverName: "Imran Hossain",
    receiverPhone: "+8801811000002",
    deliveryAddress: "Flat 3B, Road 11, Banani",
    weightKg: "1",
    price: "7.00",
    destinationZone: north,
    destinationHub: northHub,
    createdAt: "2026-11-04T03:10:00.000Z",
    updatedAt: "2026-11-04T08:40:00.000Z",
  },
  {
    ...base,
    id: "p-3",
    trackingId: "CRV-261103-M4X8TA",
    status: "DELIVERED",
    paymentStatus: "PAID",
    serviceType: "STANDARD",
    receiverName: "Shirin Akhter",
    receiverPhone: "+8801811000010",
    deliveryAddress: "Road 12, Sector 10, Uttara",
    weightKg: "1.5",
    price: "3.25",
    destinationZone: north,
    destinationHub: northHub,
    createdAt: "2026-11-03T05:00:00.000Z",
    updatedAt: "2026-11-03T13:20:00.000Z",
  },
];
