import type { Metadata } from "next";
import { NotificationsPage, type NotificationsPageConfig } from "@/components/notifications/notifications-page";

export const metadata: Metadata = { title: "Notifications", robots: { index: false } };

const CONFIG: NotificationsPageConfig = {
  description: "Updates about your bookings, payments and deliveries.",
  listHref: "/dashboard/notifications",
  shipmentBase: "/dashboard/shipments",
  emptyAction: { label: "Book a shipment", href: "/dashboard/shipments/new" },
  emptyDescription: "Updates appear here when you book, pay and when a courier moves your parcel.",
};

export default function CustomerNotificationsPage({ searchParams }: PageProps<"/dashboard/notifications">) {
  return <NotificationsPage searchParams={searchParams} config={CONFIG} />;
}
