"use client";

// Client: feeds live data (unread notifications) into the shell's header bell and nav badge.
import type { ReactNode } from "react";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { ROLE_NOTIFICATIONS } from "@/config/nav";
import { useUnreadCount } from "@/lib/queries/notifications";
import { DashboardShell } from "./dashboard-shell";
import type { ShellUser } from "./user-menu";

export function LiveShell({ user, children }: { user: ShellUser; children: ReactNode }) {
  const unread = useUnreadCount();
  const listHref = ROLE_NOTIFICATIONS[user.role];
  const badges = listHref && unread.data ? { [listHref]: unread.data } : {};
  return (
    <DashboardShell user={user} badges={badges} headerActions={<NotificationBell allHref={listHref} />}>
      {children}
    </DashboardShell>
  );
}
