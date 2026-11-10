"use client";

// Client: optimistic mark-as-read / delete and router navigation on the full list (rows come from the server render).
import { BellOff, Check, CheckCheck, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { RelativeTime } from "@/components/shared/relative-time";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { canDeleteNotifications } from "@/lib/auth/permissions";
import { formatDateTime } from "@/lib/format";
import { notificationLabel } from "@/lib/notifications/labels";
import { notificationHref } from "@/lib/notifications/link";
import { useDeleteNotification, useMarkAllRead, useMarkRead, useUnreadCount } from "@/lib/queries/notifications";
import { cn } from "@/lib/utils";
import type { AppNotification } from "@/types";
import { notificationIcon } from "./notification-meta";

/** Plain data only: this is rendered by Server Components (no functions across the boundary). */
interface NotificationsListProps {
  items: AppNotification[];
  unreadOnly: boolean;
  /** This list's own page, e.g. "/courier/notifications" (the "Show all" link). */
  listHref: string;
  /** Older rows without a `link`: their tracking id links to `${shipmentBase}/${id}`. */
  shipmentBase: string;
  /** Next step when there are no notifications at all. */
  emptyAction: { label: string; href: string };
  /** Empty-state copy for this role. */
  emptyDescription: string;
}

const without = (set: Set<string>, id: string): Set<string> => {
  const next = new Set(set);
  next.delete(id);
  return next;
};

export function NotificationsList({ items, unreadOnly, listHref, shipmentBase, emptyAction, emptyDescription }: NotificationsListProps) {
  const router = useRouter();
  const { user } = useAuth();
  // While the user loads this is false, so Delete never flashes for the read-only viewer.
  const canDelete = canDeleteNotifications(user?.role);
  const [, startTransition] = useTransition();
  const markReadMutation = useMarkRead();
  const markAllMutation = useMarkAllRead();
  const deleteMutation = useDeleteNotification();
  // Local optimistic state over the server-rendered rows (the hooks keep the bell and nav badge in sync).
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());

  // The bell polls the unread count; when it rises, new notifications exist, so re-render this list too.
  const unreadCount = useUnreadCount().data;
  const lastCount = useRef(unreadCount);
  useEffect(() => {
    const previous = lastCount.current;
    lastCount.current = unreadCount;
    if (previous !== undefined && unreadCount !== undefined && unreadCount > previous) startTransition(() => router.refresh());
  }, [unreadCount, router]);

  const isRead = (n: AppNotification) => n.isRead || readIds.has(n.id);
  const visible = items.filter((n) => !hiddenIds.has(n.id));
  const unreadHere = visible.filter((n) => !isRead(n));
  const refresh = () => startTransition(() => router.refresh());

  const markRead = async (n: AppNotification) => {
    if (isRead(n)) return;
    setReadIds((prev) => new Set(prev).add(n.id));
    try {
      await markReadMutation.mutateAsync(n.id);
      refresh();
    } catch {
      setReadIds((prev) => without(prev, n.id)); // the hook shows the error toast
    }
  };

  // Click: mark read, then go to the notification's link if it is a safe in-app path.
  const open = (n: AppNotification) => {
    void markRead(n);
    const href = notificationHref(n);
    if (href) router.push(href);
  };

  const markAll = async () => {
    const before = readIds;
    setReadIds(new Set(items.map((n) => n.id)));
    try {
      await markAllMutation.mutateAsync();
      refresh();
    } catch {
      setReadIds(before);
    }
  };

  const remove = async (n: AppNotification) => {
    setHiddenIds((prev) => new Set(prev).add(n.id));
    try {
      await deleteMutation.mutateAsync(n.id);
      refresh();
    } catch {
      setHiddenIds((prev) => without(prev, n.id));
    }
  };

  if (visible.length === 0) {
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
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground tabular" aria-live="polite">
          {unreadHere.length ? `${unreadHere.length} unread on this page` : "All read on this page"}
        </p>
        <Button variant="outline" onClick={() => void markAll()} disabled={markAllMutation.isPending || unreadHere.length === 0}>
          <CheckCheck aria-hidden="true" /> Mark all as read
        </Button>
      </div>
      <ul className="divide-y divide-border overflow-hidden rounded-xl bg-card shadow-card" aria-label="Notifications">
        {visible.map((n) => {
          const Icon = notificationIcon(n.type);
          const read = isRead(n);
          const href = notificationHref(n);
          const label = notificationLabel(n.type);
          return (
            <li key={n.id} className={cn("flex items-start gap-3 p-4 sm:gap-4 sm:p-5", !read && "bg-brand-soft/40")} data-notification-id={n.id} data-read={read}>
              <span className={cn("grid size-10 shrink-0 place-items-center rounded-full", read ? "bg-secondary" : "bg-brand text-brand-foreground")}>
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1 space-y-1">
                <button
                  type="button"
                  onClick={() => open(n)}
                  className="block w-full cursor-pointer space-y-1 rounded-md text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <span className="flex items-start gap-2">
                    {!read ? <span className="mt-2 size-2 shrink-0 rounded-full bg-brand" aria-hidden="true" /> : null}
                    <span className={cn("break-words", read ? "font-medium" : "font-bold")}>
                      {!read ? <span className="sr-only">Unread: </span> : null}
                      {n.title}
                    </span>
                  </span>
                  <span className="block text-sm break-words text-muted-foreground">{n.message}</span>
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{label}</span>
                    <RelativeTime value={n.createdAt} />
                    {href && n.shipment ? <span className="font-id">{n.shipment.trackingId}</span> : null}
                    {read && n.readAt ? <span>Read {formatDateTime(n.readAt)}</span> : null}
                  </span>
                </button>
                {/* Rows from before links existed keep their tracking-id link. */}
                {!href && n.shipment ? (
                  <Link
                    href={`${shipmentBase}/${n.shipment.id}`}
                    onClick={() => void markRead(n)}
                    className="inline-block font-id text-xs font-semibold text-foreground underline-offset-4 hover:underline"
                  >
                    {n.shipment.trackingId}
                  </Link>
                ) : null}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center">
                {!read ? (
                  <Button variant="ghost" size="sm" onClick={() => void markRead(n)}>
                    <Check aria-hidden="true" /> <span className="hidden sm:inline">Mark read</span>
                    <span className="sr-only sm:hidden">Mark &ldquo;{n.title}&rdquo; as read</span>
                  </Button>
                ) : null}
                {canDelete ? (
                  <Button variant="ghost" size="icon" onClick={() => void remove(n)} aria-label={`Delete “${n.title}”`} className="text-muted-foreground hover:text-destructive">
                    <Trash2 aria-hidden="true" />
                  </Button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
