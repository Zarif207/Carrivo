import type { NotificationType } from "@/types";

/*
 * Short label per notification type (shown next to the time, and read by screen readers).
 * Plain module: shared by Server and Client Components, and unit-tested.
 */
export const NOTIFICATION_LABELS: Record<NotificationType, string> = {
  SHIPMENT_CREATED: "Shipment booked",
  COURIER_ASSIGNED: "Courier assigned",
  PICKED_UP: "Picked up",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  FAILED_DELIVERY: "Delivery failed",
  PAYMENT_RECEIVED: "Payment received",
  REFUND_COMPLETED: "Refund completed",
  SHIPMENT_CANCELLED: "Cancelled",
  PAYMENT_FAILED: "Payment failed",
  REFUND_FAILED: "Refund failed",
  ZONE_CHANGED: "Zone change",
  HUB_CHANGED: "Hub change",
  COURIER_ADDED: "Courier added",
};

/** Label for a type, tolerating a type a newer API adds before the UI knows it. */
export const notificationLabel = (type: string): string => NOTIFICATION_LABELS[type as NotificationType] ?? "Update";
