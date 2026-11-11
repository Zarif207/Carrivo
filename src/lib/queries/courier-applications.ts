"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { apiFetch, apiFetchList } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/api/query-keys";
import { setRoleChangeHint } from "@/lib/auth/role-change-hint";
import { expectsRoleChange } from "@/lib/courier-application";
import type { CourierApplication, CourierApplicationInput, MyCourierApplications } from "@/types";

export { applicationErrorMessage } from "@/lib/courier-application";

/** While pending, look again now and then: an approval ends this session (the next call explains why). */
const PENDING_POLL_MS = 60_000;
/** Staff sidebar badge. */
const COUNT_POLL_MS = 60_000;

/**
 * The caller's applications (CUSTOMER and COURIER). Also keeps the "role change expected" hint in
 * step with a pending application (lib/auth/session-end.ts).
 */
export function useMyCourierApplications(enabled = true) {
  const query = useQuery({
    queryKey: queryKeys.courierApplications.mine(),
    queryFn: async () => (await apiFetch<MyCourierApplications>(endpoints.courierApplications.mine)).data,
    enabled,
    refetchOnWindowFocus: true,
    refetchInterval: (q) => (expectsRoleChange(q.state.data) ? PENDING_POLL_MS : false),
    refetchIntervalInBackground: false,
  });
  const pending = expectsRoleChange(query.data);
  const known = query.data !== undefined;
  useEffect(() => {
    if (known) setRoleChangeHint(pending);
  }, [known, pending]);
  return query;
}

export function useApplyAsCourier() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (body: CourierApplicationInput) => (await apiFetch<CourierApplication>(endpoints.courierApplications.apply, { method: "POST", body })).data,
    onSuccess: () => setRoleChangeHint(true),
    // A 409 (pending already, or the wait after a rejection) also means the page is out of date.
    onSettled: () => client.invalidateQueries({ queryKey: queryKeys.courierApplications.all }),
  });
}

export function useCancelCourierApplication() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await apiFetch<CourierApplication>(endpoints.courierApplications.cancel(id), { method: "PATCH" })).data,
    onSuccess: () => setRoleChangeHint(false),
    onSettled: () => client.invalidateQueries({ queryKey: queryKeys.courierApplications.all }),
  });
}

/** Staff: pending applications, for the sidebar badge (one tiny request, limit=1). */
export function usePendingCourierApplicationsCount(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.courierApplications.count({ status: "PENDING" }),
    queryFn: async () => (await apiFetchList<unknown>(endpoints.admin.courierApplications, { query: { status: "PENDING", limit: 1 } })).meta.total,
    enabled,
    refetchInterval: COUNT_POLL_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
}
