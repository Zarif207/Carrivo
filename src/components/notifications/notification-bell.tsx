"use client";

// Client: live unread count, dropdown state and optimistic mark-as-read.
import { Bell, CheckCheck } from "lucide-react";
import Link from "next/link";
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
import { useLatestNotifications, useMarkAllRead, useMarkRead, useUnreadCount } from "@/lib/queries/notifications";
import { cn } from "@/lib/utils";
import { NOTIFICATION_ICONS } from "./notification-meta";

export function NotificationBell({ allHref }: { allHref?: string | null }) {
  const [open, setOpen] = useState(false);
  const unread = useUnreadCount();
  const latest = useLatestNotifications(open);
  const markRead = useMarkRead();
  const markAll = useMarkAllRead();
  const count = unread.data ?? 0;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={count ? `Notifications, ${count} unread` : "Notifications"}>
          <Bell className="size-5" />
          {count ? (
            <span className="absolute top-1 right-1 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-brand px-1 text-[0.625rem] font-bold text-brand-foreground tabular" aria-hidden="true">
              {count > 99 ? "99+" : count}
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
        <DropdownMenuGroup className="max-h-88 overflow-y-auto p-1">
          {latest.isPending ? (
            Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="space-y-2 p-3">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))
          ) : latest.isError ? (
            <p className="p-4 text-sm text-muted-foreground">Notifications couldn&rsquo;t be loaded. Open the menu again to retry.</p>
          ) : latest.data.data.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">You&rsquo;re all caught up. Updates about your shipments appear here.</p>
          ) : (
            latest.data.data.map((n) => {
              const Icon = NOTIFICATION_ICONS[n.type];
              const body = (
                <>
                  <span className={cn("mt-0.5 grid size-8 shrink-0 place-items-center rounded-full", n.isRead ? "bg-secondary" : "bg-brand-soft text-brand-text")}>
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1 space-y-0.5">
                    <span className={cn("block truncate text-sm", n.isRead ? "font-medium" : "font-bold")}>{n.title}</span>
                    <span className="line-clamp-2 block text-xs text-muted-foreground">{n.message}</span>
                    <RelativeTime value={n.createdAt} className="block text-xs text-muted-foreground" />
                  </span>
                  {n.isRead ? null : <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand" aria-label="Unread" />}
                </>
              );
              const onSelect = () => {
                if (!n.isRead) markRead.mutate(n.id);
              };
              return (
                <DropdownMenuItem key={n.id} asChild={Boolean(n.shipment)} onSelect={onSelect} className="items-start gap-3 rounded-lg p-3">
                  {n.shipment ? <Link href={`/shipments/${n.shipment.id}`}>{body}</Link> : body}
                </DropdownMenuItem>
              );
            })
          )}
        </DropdownMenuGroup>
        {allHref ? (
          <>
            <DropdownMenuSeparator className="m-0" />
            <DropdownMenuItem asChild className="justify-center rounded-none py-3 font-semibold">
              <Link href={allHref}>See all notifications</Link>
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
