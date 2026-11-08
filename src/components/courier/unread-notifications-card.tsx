"use client";

// Client: the unread count is live (shared TanStack query with the bell and the nav badge).
import { Bell } from "lucide-react";
import Link from "next/link";
import { StatCard } from "@/components/shared/stat-card";
import { formatCount } from "@/lib/format";
import { useUnreadCount } from "@/lib/queries/notifications";

/** Stat card linking to the full notifications list; the whole card is the link. */
export function UnreadNotificationsCard({ href }: { href: string }) {
  const unread = useUnreadCount();
  const count = unread.data;
  const value = count === undefined ? "–" : formatCount(count);
  const hint = unread.isError ? "Couldn't load. Open the list to retry." : count ? "Open the list to read them" : "You're all caught up";
  return (
    <Link
      href={href}
      aria-label={count === undefined ? "Notifications" : `Notifications, ${count} unread`}
      className="block rounded-xl outline-none transition-shadow hover:shadow-overlay focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <StatCard label="Unread notifications" value={value} icon={Bell} hint={hint} className="h-full" />
    </Link>
  );
}
