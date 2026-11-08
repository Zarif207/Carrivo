import type { Metadata } from "next";
import { NotificationsPage, type NotificationsPageConfig } from "@/components/notifications/notifications-page";

export const metadata: Metadata = { title: "Notifications", robots: { index: false } };

const CONFIG: NotificationsPageConfig = {
  description: "New assignments, status changes and payouts for your deliveries.",
  listHref: "/courier/notifications",
  shipmentBase: "/courier/tasks",
  emptyAction: { label: "View active tasks", href: "/courier" },
  emptyDescription: "Updates appear here when an admin assigns you a pickup or a delivery changes.",
};

export default function CourierNotificationsPage({ searchParams }: PageProps<"/courier/notifications">) {
  return <NotificationsPage searchParams={searchParams} config={CONFIG} />;
}
