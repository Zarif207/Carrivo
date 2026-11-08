import {
  BadgeCheck,
  Ban,
  Bike,
  Building2,
  CalendarClock,
  CircleAlert,
  CircleCheckBig,
  CircleDollarSign,
  CircleX,
  ClipboardList,
  Eye,
  Hourglass,
  type LucideIcon,
  PackageCheck,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  TimerOff,
  Truck,
  Undo2,
  UserCheck,
  UserRound,
  UserX,
  Warehouse,
} from "lucide-react";
import type { EarningStatus, PaymentStatus, Role, ServiceType, ShipmentPaymentStatus, ShipmentStatus, UserStatus, VehicleType } from "@/types";

/** Colour families defined as --tone-* tokens in globals.css (light + dark). Brand orange is never a status colour. */
export type Tone =
  | "slate"
  | "sky"
  | "violet"
  | "indigo"
  | "teal"
  | "blue"
  | "cyan"
  | "amber"
  | "green"
  | "fuchsia"
  | "red"
  | "rose"
  | "stone";

/** Literal class strings so Tailwind can see them. */
export const TONE_CLASSES: Record<Tone, string> = {
  slate: "bg-tone-slate-bg text-tone-slate-fg",
  sky: "bg-tone-sky-bg text-tone-sky-fg",
  violet: "bg-tone-violet-bg text-tone-violet-fg",
  indigo: "bg-tone-indigo-bg text-tone-indigo-fg",
  teal: "bg-tone-teal-bg text-tone-teal-fg",
  blue: "bg-tone-blue-bg text-tone-blue-fg",
  cyan: "bg-tone-cyan-bg text-tone-cyan-fg",
  amber: "bg-tone-amber-bg text-tone-amber-fg",
  green: "bg-tone-green-bg text-tone-green-fg",
  fuchsia: "bg-tone-fuchsia-bg text-tone-fuchsia-fg",
  red: "bg-tone-red-bg text-tone-red-fg",
  rose: "bg-tone-rose-bg text-tone-rose-fg",
  stone: "bg-tone-stone-bg text-tone-stone-fg",
};

export interface StatusMeta {
  label: string;
  tone: Tone;
  icon: LucideIcon;
  /** Plain-language line for timelines and tooltips. */
  description: string;
}

/** One distinct tone per shipment status. */
export const SHIPMENT_STATUS_META: Record<ShipmentStatus, StatusMeta> = {
  PENDING: { label: "Booked", tone: "slate", icon: ClipboardList, description: "Shipment booked. Pay to schedule a pickup." },
  PICKUP_SCHEDULED: { label: "Pickup scheduled", tone: "sky", icon: CalendarClock, description: "Pickup window booked." },
  COURIER_ASSIGNED: { label: "Courier assigned", tone: "violet", icon: UserCheck, description: "A courier is on the way to collect it." },
  PICKED_UP: { label: "Picked up", tone: "indigo", icon: PackageCheck, description: "Collected from the sender." },
  AT_ORIGIN_HUB: { label: "At origin hub", tone: "teal", icon: Warehouse, description: "Sorted at the origin hub." },
  IN_TRANSIT: { label: "In transit", tone: "blue", icon: Truck, description: "Moving between hubs." },
  AT_DESTINATION_HUB: { label: "At destination hub", tone: "cyan", icon: Building2, description: "Arrived at the destination hub." },
  OUT_FOR_DELIVERY: { label: "Out for delivery", tone: "fuchsia", icon: Bike, description: "With the courier, on the way to the receiver." },
  DELIVERED: { label: "Delivered", tone: "green", icon: CircleCheckBig, description: "Handed to the receiver." },
  FAILED_DELIVERY: { label: "Delivery failed", tone: "amber", icon: CircleAlert, description: "Delivery attempt failed. The courier will retry." },
  RETURNED: { label: "Returned", tone: "rose", icon: Undo2, description: "Returned to the sender." },
  CANCELLED: { label: "Cancelled", tone: "stone", icon: Ban, description: "Shipment cancelled." },
};

/** One distinct tone per Payment row status. */
export const PAYMENT_STATUS_META: Record<PaymentStatus, StatusMeta> = {
  PENDING: { label: "Awaiting payment", tone: "amber", icon: Hourglass, description: "Checkout started but not completed." },
  PAID: { label: "Paid", tone: "green", icon: BadgeCheck, description: "Payment received." },
  FAILED: { label: "Failed", tone: "red", icon: CircleX, description: "The payment did not go through." },
  EXPIRED: { label: "Expired", tone: "stone", icon: TimerOff, description: "The checkout session expired." },
  REFUND_PENDING: { label: "Refund pending", tone: "violet", icon: RefreshCw, description: "Refund requested, waiting for Stripe." },
  REFUNDED: { label: "Refunded", tone: "sky", icon: RotateCcw, description: "Money returned to the card." },
};

/** `shipment.paymentStatus`. */
export const SHIPMENT_PAYMENT_STATUS_META: Record<ShipmentPaymentStatus, StatusMeta> = {
  UNPAID: { label: "Unpaid", tone: "amber", icon: CircleDollarSign, description: "Not paid yet." },
  PAID: { label: "Paid", tone: "green", icon: BadgeCheck, description: "Paid." },
  REFUNDED: { label: "Refunded", tone: "sky", icon: RotateCcw, description: "Refunded." },
};

/** Courier earnings (20 % of a delivered shipment). */
export const EARNING_STATUS_META: Record<EarningStatus, StatusMeta> = {
  PENDING: { label: "Awaiting payout", tone: "amber", icon: Hourglass, description: "Earned; not paid out yet." },
  PAID: { label: "Paid out", tone: "green", icon: BadgeCheck, description: "Paid out to you." },
};

/** Account state (admin user list). */
export const USER_STATUS_META: Record<UserStatus, StatusMeta> = {
  ACTIVE: { label: "Active", tone: "green", icon: UserCheck, description: "Can sign in." },
  INACTIVE: { label: "Deactivated", tone: "stone", icon: UserX, description: "Signed out everywhere and can't sign in." },
};

/** Roles (identity, not state: cool tones only). */
export const ROLE_META: Record<Role, StatusMeta> = {
  CUSTOMER: { label: "Customer", tone: "slate", icon: UserRound, description: "Books and pays for shipments." },
  COURIER: { label: "Courier", tone: "indigo", icon: Bike, description: "Picks up and delivers." },
  ADMIN: { label: "Admin", tone: "violet", icon: ShieldCheck, description: "Runs operations." },
  ADMIN_VIEWER: { label: "Admin (view-only)", tone: "teal", icon: Eye, description: "Sees operations, changes nothing." },
};

/** The normal path a parcel takes, used to show upcoming stops. */
export const SHIPMENT_MAIN_PATH: readonly ShipmentStatus[] = [
  "PENDING",
  "PICKUP_SCHEDULED",
  "COURIER_ASSIGNED",
  "PICKED_UP",
  "AT_ORIGIN_HUB",
  "IN_TRANSIT",
  "AT_DESTINATION_HUB",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

export const VEHICLE_NAMES: Record<VehicleType, string> = { BICYCLE: "Bicycle", MOTORCYCLE: "Motorcycle", CAR: "Car", VAN: "Van", TRUCK: "Truck" };

export const SERVICE_NAMES: Record<ServiceType, string> = { STANDARD: "Standard", EXPRESS: "Express", SAME_DAY: "Same day" };
