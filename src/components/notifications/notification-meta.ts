import { BadgeCheck, Bike, CircleAlert, CircleCheckBig, PackageCheck, PackagePlus, RotateCcw, UserCheck, type LucideIcon } from "lucide-react";
import type { NotificationType } from "@/types";

/** Icon per notification type (the API's eight lifecycle events). */
export const NOTIFICATION_ICONS: Record<NotificationType, LucideIcon> = {
  SHIPMENT_CREATED: PackagePlus,
  COURIER_ASSIGNED: UserCheck,
  PICKED_UP: PackageCheck,
  OUT_FOR_DELIVERY: Bike,
  DELIVERED: CircleCheckBig,
  FAILED_DELIVERY: CircleAlert,
  PAYMENT_RECEIVED: BadgeCheck,
  REFUND_COMPLETED: RotateCcw,
};
