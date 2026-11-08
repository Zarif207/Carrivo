/*
 * Sample values for the illustrative dashboard preview on the home page. They are typed with the
 * API's own shapes and mirror the seeded data (zones, hubs, prices, tracking ids), but they are a
 * picture of the product, not live data, and the preview says so.
 */
import type { ShipmentListItem } from "@/types";

const north = { id: "z-n", name: "New York Metro", code: "NYC" };
const south = { id: "z-s", name: "Los Angeles Metro", code: "LA" };
const northHub = { id: "h-n", name: "Queens Hub", code: "HUB-NYC", city: "Long Island City" };
const southHub = { id: "h-s", name: "Downtown LA Hub", code: "HUB-LA", city: "Los Angeles" };
const customer = { id: "c-1", name: "Emily Carter" };

/* Fictional people; phone numbers use the reserved 555-0100 to 555-0199 range. */
const base = {
  senderName: "Emily Carter",
  pickupAddress: "120 W 45th St, New York, NY 10036",
  currency: "usd",
  originZone: north,
  originHub: northHub,
  customer,
  courier: { id: "r-1", name: "Marcus" },
} as const;

export const PREVIEW_SHIPMENTS: ShipmentListItem[] = [
  {
    ...base,
    id: "p-1",
    trackingId: "CRV-261101-SEED05",
    status: "IN_TRANSIT",
    paymentStatus: "PAID",
    serviceType: "EXPRESS",
    receiverName: "Mia Davis",
    receiverPhone: "(323) 555-0144",
    deliveryAddress: "1520 N Vine St, Los Angeles, CA 90028",
    weightLb: "5.1",
    price: "34.00",
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
    receiverName: "Ethan Garcia",
    receiverPhone: "(347) 555-0145",
    deliveryAddress: "31-15 Steinway St, Astoria, NY 11103",
    weightLb: "1.8",
    price: "18.00",
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
    receiverName: "Benjamin Clark",
    receiverPhone: "(646) 555-0149",
    deliveryAddress: "410 E 61st St, New York, NY 10065",
    weightLb: "3.3",
    price: "7.70",
    destinationZone: north,
    destinationHub: northHub,
    createdAt: "2026-11-03T05:00:00.000Z",
    updatedAt: "2026-11-03T13:20:00.000Z",
  },
];
