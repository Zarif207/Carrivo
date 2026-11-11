"use client";

// Client: feeds live data (unread notifications, and pending courier applications for staff) into the
// shell's header bell and nav badges.
import type { ReactNode } from "react";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { ADMIN_COURIER_APPLICATIONS, ROLE_NOTIFICATIONS } from "@/config/nav";
import { isStaff } from "@/lib/auth/permissions";
import { usePendingCourierApplicationsCount } from "@/lib/queries/courier-applications";
import { useUnreadCount } from "@/lib/queries/notifications";
import { DashboardShell } from "./dashboard-shell";
import type { ShellUser } from "./user-menu";

export function LiveShell({ user, children }: { user: ShellUser; children: ReactNode }) {
  const unread = useUnreadCount();
  const pending = usePendingCourierApplicationsCount(isStaff(user.role));
  const listHref = ROLE_NOTIFICATIONS[user.role];
  const badges: Partial<Record<string, number>> = {};
  if (listHref && unread.data) badges[listHref] = unread.data;
  if (pending.data) badges[ADMIN_COURIER_APPLICATIONS] = pending.data;
  return (
    <DashboardShell user={user} badges={badges} headerActions={<NotificationBell allHref={listHref} />}>
      {children}
    </DashboardShell>
  );
}
