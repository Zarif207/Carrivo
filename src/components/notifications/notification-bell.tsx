"use client";

// Client: live unread count, dropdown state, optimistic mark-as-read and router navigation.
import { Bell, CheckCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { RelativeTime } from "@/components/shared/relative-time";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { notificationLabel } from "@/lib/notifications/labels";
import { notificationHref } from "@/lib/notifications/link";
import { BELL_LIMIT, useLatestNotifications, useMarkAllRead, useMarkRead, useUnreadCount } from "@/lib/queries/notifications";
import { cn } from "@/lib/utils";
import type { AppNotification } from "@/types";
import { notificationIcon } from "./notification-meta";

/** "99+" above 99, so the badge never grows past three characters. */
const badgeText = (count: number): string => (count > 99 ? "99+" : String(count));

export function NotificationBell({ allHref }: { allHref?: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const unread = useUnreadCount();
  const latest = useLatestNotifications(open);
  const markRead = useMarkRead();
  const markAll = useMarkAllRead();
  const count = unread.data ?? 0;

  // Every role may mark its own notifications read (the viewer included); navigation is in-app only.
  const openNotification = (n: AppNotification) => {
    if (!n.isRead) markRead.mutate(n.id);
    const href = notificationHref(n);
    if (href) router.push(href);
  };

  return (
    <>
      {/* Announces count changes (polling, reads elsewhere) without moving focus. */}
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {unread.isSuccess ? (count ? `${count} unread notification${count === 1 ? "" : "s"}` : "No unread notifications") : ""}
      </span>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative" aria-label={count ? `Notifications, ${count} unread` : "Notifications"}>
            <Bell className="size-5" aria-hidden="true" />
            {/* Absolutely positioned, so the badge appearing or growing never shifts the header. */}
            {count ? (
              <span
                className="pointer-events-none absolute top-1 right-1 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-brand px-1 text-[0.625rem] leading-none font-bold text-brand-foreground tabular"
                aria-hidden="true"
              >
                {badgeText(count)}
              </span>
            ) : null}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[min(24rem,calc(100vw-2rem))] p-0">
          <div className="flex items-center justify-between gap-2 px-4 py-3">
            <DropdownMenuLabel className="p-0 text-base font-bold text-foreground">Notifications</DropdownMenuLabel>
            <Button variant="ghost" size="sm" disabled={!count || markAll.isPending} onClick={() => markAll.mutate()}>
              <CheckCheck aria-hidden="true" /> Mark all read
            </Button>
          </div>
          <DropdownMenuSeparator className="m-0" />
          <DropdownMenuGroup className="max-h-88 overflow-y-auto p-1" aria-label={`Latest ${BELL_LIMIT} notifications`}>
            {latest.isPending ? (
              Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="space-y-2 p-3" aria-hidden="true">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))
            ) : latest.isError ? (
              <div className="space-y-2 p-4 text-sm text-muted-foreground">
                <p>Notifications couldn&rsquo;t be loaded.</p>
                <Button variant="outline" size="sm" onClick={() => void latest.refetch()}>
                  Try again
                </Button>
              </div>
            ) : latest.data.data.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">You&rsquo;re all caught up. New updates appear here.</p>
            ) : (
              latest.data.data.map((n) => {
                const Icon = notificationIcon(n.type);
                return (
                  <DropdownMenuItem key={n.id} onSelect={() => openNotification(n)} className="cursor-pointer items-start gap-3 rounded-lg p-3">
                    <span className={cn("mt-0.5 grid size-8 shrink-0 place-items-center rounded-full", n.isRead ? "bg-secondary" : "bg-brand-soft text-brand-text")}>
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1 space-y-0.5">
                      <span className={cn("block truncate text-sm", n.isRead ? "font-medium" : "font-bold")}>
                        {n.isRead ? null : <span className="sr-only">Unread: </span>}
                        {n.title}
                      </span>
                      <span className="line-clamp-2 block text-xs text-muted-foreground">{n.message}</span>
                      <span className="block text-xs text-muted-foreground">
                        {notificationLabel(n.type)} · <RelativeTime value={n.createdAt} />
                      </span>
                    </span>
                    {n.isRead ? null : <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand" aria-hidden="true" />}
                  </DropdownMenuItem>
                );
              })
            )}
          </DropdownMenuGroup>
          {allHref ? (
            <>
              <DropdownMenuSeparator className="m-0" />
              <DropdownMenuItem asChild className="justify-center rounded-none py-3 font-semibold">
                <Link href={allHref}>View all notifications</Link>
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
