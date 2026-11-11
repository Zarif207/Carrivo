import {
  BadgeCheck,
  BadgeX,
  Bell,
  Bike,
  CircleAlert,
  CircleCheckBig,
  ClipboardCheck,
  ClipboardList,
  ClipboardX,
  MapPinned,
  PackageCheck,
  PackagePlus,
  PackageX,
  RotateCcw,
  TriangleAlert,
  UserCheck,
  UserPlus,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import type { NotificationType } from "@/types";

/** Icon per notification type: customer/courier lifecycle events and the staff feed. */
export const NOTIFICATION_ICONS: Record<NotificationType, LucideIcon> = {
  SHIPMENT_CREATED: PackagePlus,
  COURIER_ASSIGNED: UserCheck,
  PICKED_UP: PackageCheck,
  OUT_FOR_DELIVERY: Bike,
  DELIVERED: CircleCheckBig,
  FAILED_DELIVERY: CircleAlert,
  PAYMENT_RECEIVED: BadgeCheck,
  REFUND_COMPLETED: RotateCcw,
  SHIPMENT_CANCELLED: PackageX,
  PAYMENT_FAILED: BadgeX,
  REFUND_FAILED: TriangleAlert,
  ZONE_CHANGED: MapPinned,
  HUB_CHANGED: Warehouse,
  COURIER_ADDED: UserPlus,
  COURIER_APPLICATION_SUBMITTED: ClipboardList,
  COURIER_APPLICATION_APPROVED: ClipboardCheck,
  COURIER_APPLICATION_REJECTED: ClipboardX,
};

/** Icon for a type, with a plain bell for a type a newer API adds before the UI knows it. */
export const notificationIcon = (type: string): LucideIcon => NOTIFICATION_ICONS[type as NotificationType] ?? Bell;
