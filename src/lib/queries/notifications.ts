"use client";

import { useMutation, useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch, apiFetchList } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { Paginated } from "@/lib/api/types";
import { queryKeys } from "@/lib/api/query-keys";
import type { AppNotification, DeletedNotification, MarkAllReadResult, UnreadCount } from "@/types";

/* Under queryKeys.notifications.all, so invalidating notifications refreshes the count too. */
const UNREAD_KEY = ["notifications", "unread-count"] as const;
/** Poll while the tab is visible (TanStack pauses intervals in background tabs); focus refetches at once. */
const POLL_MS = 30_000;
/** Rows in the bell dropdown. */
export const BELL_LIMIT = 5;

/** Unread count for the bell, the nav badge and the courier card (GET /notifications/unread-count). */
export function useUnreadCount() {
  return useQuery({
    queryKey: UNREAD_KEY,
    queryFn: async () => (await apiFetch<UnreadCount>(endpoints.notifications.unreadCount)).data.unread,
    refetchInterval: POLL_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
}

/** Latest notifications for the bell dropdown (fetched while it is open). */
export function useLatestNotifications(enabled: boolean, limit = BELL_LIMIT) {
  return useQuery({
    queryKey: queryKeys.notifications.mine({ limit }),
    queryFn: () => apiFetchList<AppNotification>(endpoints.notifications.mine, { query: { limit } }),
    enabled,
  });
}

type Client = ReturnType<typeof useQueryClient>;
type Snapshot = { key: QueryKey; data: unknown }[];

/** Applies `change` to every cached notification list and adjusts the unread count; returns a rollback snapshot. */
function patchCaches(client: Client, change: (rows: AppNotification[]) => { rows: AppNotification[]; unreadDelta: number | "zero" }): Snapshot {
  const snapshot: Snapshot = [];
  let delta: number | "zero" = 0;
  for (const [key, data] of client.getQueriesData<Paginated<AppNotification>>({ queryKey: queryKeys.notifications.all })) {
    if (!data || !Array.isArray(data.data)) continue;
    snapshot.push({ key, data });
    const result = change(data.data);
    // Every list holds the same rows, so the count changes once (by the largest list's view).
    if (result.unreadDelta === "zero") delta = "zero";
    else if (delta !== "zero" && Math.abs(result.unreadDelta) > Math.abs(delta)) delta = result.unreadDelta;
    const removed = data.data.length - result.rows.length;
    client.setQueryData(key, { ...data, data: result.rows, meta: { ...data.meta, total: Math.max(0, data.meta.total - removed) } });
  }
  const unread = client.getQueryData<number>(UNREAD_KEY);
  if (typeof unread === "number") {
    snapshot.push({ key: UNREAD_KEY, data: unread });
    client.setQueryData(UNREAD_KEY, delta === "zero" ? 0 : Math.max(0, unread + delta));
  }
  return snapshot;
}

const markRows = (ids: string[] | "all") => (rows: AppNotification[]) => {
  const now = new Date().toISOString();
  let changed = 0;
  const next = rows.map((n) => {
    if (n.isRead || (ids !== "all" && !ids.includes(n.id))) return n;
    changed += 1;
    return { ...n, isRead: true, readAt: now };
  });
  return { rows: next, unreadDelta: ids === "all" ? ("zero" as const) : -changed };
};

const removeRow = (id: string) => (rows: AppNotification[]) => {
  const target = rows.find((n) => n.id === id);
  return { rows: rows.filter((n) => n.id !== id), unreadDelta: target && !target.isRead ? -1 : 0 };
};

function rollback(client: Client, snapshot: Snapshot | undefined) {
  for (const { key, data } of snapshot ?? []) client.setQueryData(key, data);
}

/** Mark one as read (every role, the read-only viewer included). Optimistic; a failure rolls back with a toast. */
export function useMarkRead() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<AppNotification>(endpoints.notifications.read(id), { method: "PATCH" }),
    onMutate: async (id) => {
      await client.cancelQueries({ queryKey: queryKeys.notifications.all });
      return patchCaches(client, markRows([id]));
    },
    onError: (_error, _id, snapshot) => {
      rollback(client, snapshot);
      toast.error("Couldn't mark the notification as read. Try again.");
    },
    onSettled: () => client.invalidateQueries({ queryKey: queryKeys.notifications.all }),
  });
}

/** Mark every own notification as read (every role, the read-only viewer included). */
export function useMarkAllRead() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<MarkAllReadResult>(endpoints.notifications.readAll, { method: "PATCH" }),
    onMutate: async () => {
      await client.cancelQueries({ queryKey: queryKeys.notifications.all });
      return patchCaches(client, markRows("all"));
    },
    onSuccess: (result) => toast.success(result.data.updated === 1 ? "1 notification marked as read" : `${result.data.updated} notifications marked as read`),
    onError: (_error, _vars, snapshot) => {
      rollback(client, snapshot);
      toast.error("Couldn't mark notifications as read. Try again.");
    },
    onSettled: () => client.invalidateQueries({ queryKey: queryKeys.notifications.all }),
  });
}

/** Delete one own notification. Not for the read-only viewer (hidden in the UI; the BFF and API refuse it). */
export function useDeleteNotification() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<DeletedNotification>(endpoints.notifications.remove(id), { method: "DELETE" }),
    onMutate: async (id) => {
      await client.cancelQueries({ queryKey: queryKeys.notifications.all });
      return patchCaches(client, removeRow(id));
    },
    onSuccess: () => toast.success("Notification deleted"),
    onError: (_error, _id, snapshot) => {
      rollback(client, snapshot);
      toast.error("Couldn't delete the notification. Try again.");
    },
    onSettled: () => client.invalidateQueries({ queryKey: queryKeys.notifications.all }),
  });
}
