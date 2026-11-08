"use client";

// Client: optimistic mark-as-read on the full list (rows come from the server render).
import { useQueryClient } from "@tanstack/react-query";
import { BellOff, Check, CheckCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { RelativeTime } from "@/components/shared/relative-time";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/api/query-keys";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AppNotification, MarkAllReadResult } from "@/types";
import { NOTIFICATION_ICONS } from "./notification-meta";

/** Plain data only: this is rendered by Server Components (no functions across the boundary). */
interface NotificationsListProps {
  items: AppNotification[];
  unreadOnly: boolean;
  /** This list's own page, e.g. "/courier/notifications" (the "Show all" link). */
  listHref: string;
  /** Where a shipment link goes in this area: `${shipmentBase}/${id}`. */
  shipmentBase: string;
  /** Next step when there are no notifications at all. */
  emptyAction: { label: string; href: string };
  /** Empty-state copy for this role. */
  emptyDescription: string;
}

export function NotificationsList({ items, unreadOnly, listHref, shipmentBase, emptyAction, emptyDescription }: NotificationsListProps) {
  const router = useRouter();
  const client = useQueryClient();
  const [, startTransition] = useTransition();
  // Ids marked read locally, ahead of the server (optimistic).
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [allPending, setAllPending] = useState(false);

  const isRead = (n: AppNotification) => n.isRead || readIds.has(n.id);
  const unreadHere = items.filter((n) => !isRead(n));

  const sync = () => {
    void client.invalidateQueries({ queryKey: queryKeys.notifications.all }); // bell + nav badge
    startTransition(() => router.refresh());
  };

  const markRead = async (n: AppNotification) => {
    if (isRead(n)) return;
    setReadIds((prev) => new Set(prev).add(n.id));
    try {
      await apiFetch<AppNotification>(endpoints.notifications.read(n.id), { method: "PATCH" });
      sync();
    } catch {
      setReadIds((prev) => {
        const next = new Set(prev);
        next.delete(n.id);
        return next;
      });
      toast.error("Couldn't mark it as read. Try again.");
    }
  };

  const markAll = async () => {
    const before = readIds;
    setAllPending(true);
    setReadIds(new Set(items.map((n) => n.id)));
    try {
      const { data } = await apiFetch<MarkAllReadResult>(endpoints.notifications.readAll, { method: "PATCH" });
      toast.success(data.updated === 1 ? "1 notification marked as read" : `${data.updated} notifications marked as read`);
      sync();
    } catch {
      setReadIds(before);
      toast.error("Couldn't mark notifications as read. Try again.");
    } finally {
      setAllPending(false);
    }
  };

  if (items.length === 0) {
    return (
      <EmptyState
        icon={BellOff}
        title={unreadOnly ? "No unread notifications" : "No notifications yet"}
        description={unreadOnly ? "You've read everything." : emptyDescription}
        action={
          unreadOnly ? (
            <Button asChild variant="outline">
              <Link href={listHref}>Show all</Link>
            </Button>
          ) : (
            <Button asChild>
              <Link href={emptyAction.href}>{emptyAction.label}</Link>
            </Button>
          )
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" onClick={markAll} disabled={allPending || unreadHere.length === 0}>
          <CheckCheck aria-hidden="true" /> Mark all as read
        </Button>
      </div>
      <ul className="divide-y divide-border overflow-hidden rounded-xl bg-card shadow-card">
        {items.map((n) => {
          const Icon = NOTIFICATION_ICONS[n.type];
          const read = isRead(n);
          return (
            <li key={n.id} className={cn("flex items-start gap-4 p-4 sm:p-5", !read && "bg-brand-soft/40")}>
              <span className={cn("grid size-10 shrink-0 place-items-center rounded-full", read ? "bg-secondary" : "bg-brand text-brand-foreground")}>
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1 space-y-1">
                <p className={cn("break-words", read ? "font-medium" : "font-bold")}>
                  {!read ? <span className="sr-only">Unread: </span> : null}
                  {n.title}
                </p>
                <p className="text-sm break-words text-muted-foreground">{n.message}</p>
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <RelativeTime value={n.createdAt} />
                  {n.shipment ? (
                    <Link href={`${shipmentBase}/${n.shipment.id}`} onClick={() => void markRead(n)} className="font-id font-semibold text-foreground underline-offset-4 hover:underline">
                      {n.shipment.trackingId}
                    </Link>
                  ) : null}
                  {read && n.readAt ? <span>Read {formatDateTime(n.readAt)}</span> : null}
                </p>
              </div>
              {!read ? (
                <Button variant="ghost" size="sm" onClick={() => void markRead(n)} className="shrink-0">
                  <Check aria-hidden="true" /> <span className="hidden sm:inline">Mark read</span>
                  <span className="sr-only sm:hidden">Mark &ldquo;{n.title}&rdquo; as read</span>
                </Button>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
