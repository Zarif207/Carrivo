import type { Metadata } from "next";
import { NotificationsPage, type NotificationsPageConfig } from "@/components/notifications/notifications-page";

export const metadata: Metadata = { title: "Notifications", robots: { index: false } };

/** Admin and admin viewer: the staff feed. Same shared page as customers and couriers; only the copy and links differ. */
const CONFIG: NotificationsPageConfig = {
  description: "Bookings, payments, refunds, deliveries and network changes that need an operator's eye.",
  listHref: "/admin/notifications",
  shipmentBase: "/admin/shipments",
  emptyAction: { label: "Open shipments", href: "/admin/shipments" },
  emptyDescription: "Staff updates appear here when customers book and pay, deliveries succeed or fail, refunds run, and zones, hubs or couriers change.",
};

export default function AdminNotificationsPage({ searchParams }: PageProps<"/admin/notifications">) {
  return <NotificationsPage searchParams={searchParams} config={CONFIG} />;
}
