import "server-only";

import { endpoints } from "@/lib/api/endpoints";
import type { Paginated } from "@/lib/api/types";
import type { MyPaymentsQuery, Payment, PaymentVerification, ShipmentDetail, ShipmentListItem, ShipmentListQuery } from "@/types";
import { sessionCount, sessionFetch, sessionFetchList } from "./session-fetch";

/* Customer reads (Server Components). Each call is request-time and uses the session token. */

export const listMyShipments = (query: ShipmentListQuery): Promise<Paginated<ShipmentListItem>> =>
  sessionFetchList<ShipmentListItem>(endpoints.shipments.list, { query });

export const getMyShipment = async (id: string): Promise<ShipmentDetail> => (await sessionFetch<ShipmentDetail>(endpoints.shipments.detail(id))).data;

export const listMyPayments = (query: MyPaymentsQuery): Promise<Paginated<Payment>> =>
  sessionFetchList<Payment>(endpoints.payments.mine, { query });

/** Asks the API to check the Checkout session with Stripe (and reconcile it). Safe to repeat. */
export const verifyMyPayment = async (sessionId: string): Promise<PaymentVerification> =>
  (await sessionFetch<PaymentVerification>(endpoints.payments.verify, { query: { session_id: sessionId } })).data;

export interface CustomerOverview {
  total: number;
  delivered: number;
  active: number;
  /** Sum of PAID payments in the range (USD), refunded ones excluded. */
  spend: number;
  paidCount: number;
  recent: ShipmentListItem[];
}

/**
 * Stats for /dashboard in five requests:
 * - shipments in range, newest first, limit 5 → recent rows + meta.total;
 * - meta.total (limit=1) for DELIVERED, CANCELLED and RETURNED in range → active = total − those;
 * - PAID payments (limit 100, newest paid first) → summed client-side by paidAt within the range,
 *   because GET /payments/my has no date filter.
 */
export async function getCustomerOverview(range: { fromDate: string; toDate: string; fromIso: string; toIso: string }): Promise<CustomerOverview> {
  const dates = { fromDate: range.fromDate, toDate: range.toDate };
  const [recent, delivered, cancelled, returned, payments] = await Promise.all([
    listMyShipments({ ...dates, limit: 5, sortBy: "createdAt", sortOrder: "desc" }),
    sessionCount(endpoints.shipments.list, { ...dates, status: "DELIVERED" }),
    sessionCount(endpoints.shipments.list, { ...dates, status: "CANCELLED" }),
    sessionCount(endpoints.shipments.list, { ...dates, status: "RETURNED" }),
    sessionFetchList<Payment>(endpoints.payments.mine, { query: { status: "PAID", limit: 100, sortBy: "paidAt", sortOrder: "desc" } }),
  ]);

  const from = Date.parse(range.fromIso);
  const to = Date.parse(range.toIso);
  const inRange = payments.data.filter((p) => {
    const at = p.paidAt ? Date.parse(p.paidAt) : NaN;
    return at >= from && at <= to;
  });
  const spend = inRange.reduce((sum, p) => sum + Number(p.paidAmount ?? p.amount), 0);

  const total = recent.meta.total;
  return {
    total,
    delivered,
    active: Math.max(0, total - delivered - cancelled - returned),
    spend: Math.round(spend * 100) / 100,
    paidCount: inRange.length,
    recent: recent.data,
  };
}
