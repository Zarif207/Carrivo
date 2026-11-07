"use client";

import { useMutation, useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch, apiFetchList } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { Paginated } from "@/lib/api/types";
import { queryKeys } from "@/lib/api/query-keys";
import type { AppNotification, MarkAllReadResult } from "@/types";

const UNREAD_KEY = ["notifications", "unread-count"] as const;
const POLL_MS = 60_000;

/** Unread count for the bell and nav badge (meta.total of unread=true&limit=1). */
export function useUnreadCount() {
  return useQuery({
    queryKey: UNREAD_KEY,
    queryFn: async () => (await apiFetchList<AppNotification>(endpoints.notifications.mine, { query: { unread: "true", limit: 1 } })).meta.total,
    refetchInterval: POLL_MS,
    refetchOnWindowFocus: true,
  });
}

/** Latest notifications for the bell dropdown. */
export function useLatestNotifications(enabled: boolean, limit = 6) {
  return useQuery({
    queryKey: queryKeys.notifications.mine({ limit }),
    queryFn: () => apiFetchList<AppNotification>(endpoints.notifications.mine, { query: { limit } }),
    enabled,
  });
}

type Snapshot = { key: QueryKey; data: unknown }[];

/** Optimistically flips notifications to read in every cached list and the unread count. */
function optimisticRead(client: ReturnType<typeof useQueryClient>, ids: string[] | "all"): Snapshot {
  const snapshot: Snapshot = [];
  const now = new Date().toISOString();
  for (const [key, data] of client.getQueriesData<Paginated<AppNotification>>({ queryKey: queryKeys.notifications.all })) {
    if (!data || !Array.isArray(data.data)) continue;
    snapshot.push({ key, data });
    let changed = 0;
    const rows = data.data.map((n) => {
      if (n.isRead || (ids !== "all" && !ids.includes(n.id))) return n;
      changed += 1;
      return { ...n, isRead: true, readAt: now };
    });
    if (changed) client.setQueryData(key, { ...data, data: rows });
  }
  const unread = client.getQueryData<number>(UNREAD_KEY);
  if (typeof unread === "number") {
    snapshot.push({ key: UNREAD_KEY, data: unread });
    client.setQueryData(UNREAD_KEY, ids === "all" ? 0 : Math.max(0, unread - ids.length));
  }
  return snapshot;
}

function rollback(client: ReturnType<typeof useQueryClient>, snapshot: Snapshot | undefined) {
  for (const { key, data } of snapshot ?? []) client.setQueryData(key, data);
}

export function useMarkRead() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<AppNotification>(endpoints.notifications.read(id), { method: "PATCH" }),
    onMutate: async (id) => {
      await client.cancelQueries({ queryKey: queryKeys.notifications.all });
      return optimisticRead(client, [id]);
    },
    onError: (_error, _id, snapshot) => {
      rollback(client, snapshot);
      toast.error("Couldn't mark the notification as read. Try again.");
    },
    onSettled: () => client.invalidateQueries({ queryKey: queryKeys.notifications.all }),
  });
}

export function useMarkAllRead() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<MarkAllReadResult>(endpoints.notifications.readAll, { method: "PATCH" }),
    onMutate: async () => {
      await client.cancelQueries({ queryKey: queryKeys.notifications.all });
      return optimisticRead(client, "all");
    },
    onSuccess: (result) => toast.success(result.data.updated === 1 ? "1 notification marked as read" : `${result.data.updated} notifications marked as read`),
    onError: (_error, _vars, snapshot) => {
      rollback(client, snapshot);
      toast.error("Couldn't mark notifications as read. Try again.");
    },
    onSettled: () => client.invalidateQueries({ queryKey: queryKeys.notifications.all }),
  });
}
