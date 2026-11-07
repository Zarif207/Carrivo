import "server-only";

import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import type { PaginationMeta, Paginated } from "@/lib/api/types";
import type { CourierTask, CourierTaskQuery, EarningQuery, EarningsResult, ShipmentDetail } from "@/types";
import { sessionCount, sessionFetch, sessionFetchList } from "./session-fetch";

/* Courier reads (Server Components). Each call is request-time and uses the session token. */

/** Omit `status` for active tasks (not DELIVERED / RETURNED / CANCELLED). */
export const listMyTasks = (query: CourierTaskQuery): Promise<Paginated<CourierTask>> => sessionFetchList<CourierTask>(endpoints.couriers.myTasks, { query });

/** GET /shipments/:id answers 404 unless the shipment is assigned to this courier. */
export const getMyTask = async (id: string): Promise<ShipmentDetail> => (await sessionFetch<ShipmentDetail>(endpoints.shipments.detail(id))).data;

export interface EarningsPage extends EarningsResult {
  meta: PaginationMeta;
}

/** `summary` covers the date range across statuses; `earnings` is the requested page. */
export async function getMyEarnings(query: EarningQuery): Promise<EarningsPage> {
  const result = await sessionFetch<EarningsResult>(endpoints.couriers.myEarnings, { query });
  if (!result.meta) throw new ApiError(500, "Expected pagination meta from earnings");
  return { ...result.data, meta: result.meta };
}

export interface CourierOverview {
  active: number;
  delivered: number;
  totalEarned: string;
  pending: string;
}

/** Stat cards in two requests: active tasks via meta.total (limit=1), the rest from the all-time earnings summary. */
export async function getCourierOverview(): Promise<CourierOverview> {
  const [active, earnings] = await Promise.all([sessionCount(endpoints.couriers.myTasks), getMyEarnings({ limit: 1 })]);
  return { active, delivered: earnings.summary.deliveries, totalEarned: earnings.summary.totalEarned, pending: earnings.summary.pending };
}
