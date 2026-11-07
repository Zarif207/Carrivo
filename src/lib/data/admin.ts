import "server-only";

import { endpoints } from "@/lib/api/endpoints";
import type { Paginated } from "@/lib/api/types";
import { requireRole } from "@/lib/auth/current-user";
import type {
  AdminPayment,
  AdminPaymentsQuery,
  AdminUser,
  AdminUserListQuery,
  AuditLog,
  AuditLogQuery,
  CourierListItem,
  CourierListQuery,
  DashboardStats,
  Hub,
  HubListQuery,
  PricingListQuery,
  PricingRule,
  ShipmentDetail,
  ShipmentListItem,
  ShipmentListQuery,
  Zone,
  ZoneListQuery,
} from "@/types";
import { sessionCount, sessionFetch, sessionFetchList } from "./session-fetch";

/*
 * Admin reads (Server Components). Every loader re-checks the role first: requireRole() reuses the
 * layout's request-cached GET /users/me, so the gate costs no extra request, and a page rendered on
 * its own (or a session whose role changed) still can't load admin data.
 */

async function gate(): Promise<void> {
  await requireRole("ADMIN");
}

const list = async <T>(path: string, query: object): Promise<Paginated<T>> => {
  await gate();
  return sessionFetchList<T>(path, { query });
};

const one = async <T>(path: string, query?: object): Promise<T> => {
  await gate();
  return (await sessionFetch<T>(path, query ? { query } : {})).data;
};

const count = async (path: string, query: object): Promise<number> => {
  await gate();
  return sessionCount(path, query);
};

/** Cached 60 s by the API. */
export const getDashboardStats = () => one<DashboardStats>(endpoints.admin.dashboardStats);

export const listAdminShipments = (query: ShipmentListQuery) => list<ShipmentListItem>(endpoints.shipments.list, query);
export const getAdminShipment = (id: string) => one<ShipmentDetail>(endpoints.shipments.detail(id));

export const listAdminPayments = (query: AdminPaymentsQuery) => list<AdminPayment>(endpoints.admin.payments, query);
export const countAdminPayments = (query: AdminPaymentsQuery) => count(endpoints.admin.payments, query);

export const listCouriers = (query: CourierListQuery) => list<CourierListItem>(endpoints.couriers.list, query);
export const listAdminUsers = (query: AdminUserListQuery) => list<AdminUser>(endpoints.admin.users, query);
export const listAuditLogs = (query: AuditLogQuery) => list<AuditLog>(endpoints.admin.auditLogs, query);

/** Settings lists include inactive records (isActive=all) so they can be reactivated. */
export const listAdminZones = (query: ZoneListQuery) => list<Zone>(endpoints.zones.list, query);
export const listAdminHubs = (query: HubListQuery) => list<Hub>(endpoints.hubs.list, query);
export const listPricingRules = (query: PricingListQuery) => list<PricingRule>(endpoints.pricing.list, query);
