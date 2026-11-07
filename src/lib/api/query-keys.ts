import type {
  AdminPaymentsQuery,
  AdminUserListQuery,
  AuditLogQuery,
  CourierListQuery,
  CourierTaskQuery,
  EarningQuery,
  HubListQuery,
  MyPaymentsQuery,
  NotificationQuery,
  PriceEstimateInput,
  PricingListQuery,
  ShipmentListQuery,
  ZoneListQuery,
} from "@/types";

/**
 * TanStack Query keys, as hierarchical factories: invalidating a prefix (e.g. `queryKeys.shipments.all`)
 * refetches everything below it. Pass the same typed query object the API call uses.
 *
 * After a shipment mutation, invalidate: shipments.all, couriers.tasksAll, admin.dashboardStats(),
 * notifications.all (and payments.all when payment or refund state may change).
 */
export const queryKeys = {
  me: () => ["me"] as const,

  zones: {
    all: ["zones"] as const,
    list: (query: ZoneListQuery = {}) => ["zones", "list", query] as const,
    detail: (id: string) => ["zones", "detail", id] as const,
  },

  hubs: {
    all: ["hubs"] as const,
    list: (query: HubListQuery = {}) => ["hubs", "list", query] as const,
    detail: (id: string) => ["hubs", "detail", id] as const,
  },

  pricing: {
    all: ["pricing"] as const,
    list: (query: PricingListQuery = {}) => ["pricing", "list", query] as const,
    detail: (id: string) => ["pricing", "detail", id] as const,
    estimate: (input: PriceEstimateInput) => ["pricing", "estimate", input] as const,
  },

  shipments: {
    all: ["shipments"] as const,
    lists: () => ["shipments", "list"] as const,
    list: (query: ShipmentListQuery = {}) => ["shipments", "list", query] as const,
    detail: (id: string) => ["shipments", "detail", id] as const,
  },

  tracking: {
    detail: (trackingId: string) => ["tracking", trackingId.toUpperCase()] as const,
  },

  couriers: {
    all: ["couriers"] as const,
    list: (query: CourierListQuery = {}) => ["couriers", "list", query] as const,
    tasksAll: ["couriers", "tasks"] as const,
    tasks: (query: CourierTaskQuery = {}) => ["couriers", "tasks", query] as const,
    earnings: (query: EarningQuery = {}) => ["couriers", "earnings", query] as const,
  },

  payments: {
    all: ["payments"] as const,
    mine: (query: MyPaymentsQuery = {}) => ["payments", "mine", query] as const,
    detail: (id: string) => ["payments", "detail", id] as const,
    verify: (sessionId: string) => ["payments", "verify", sessionId] as const,
    admin: (query: AdminPaymentsQuery = {}) => ["payments", "admin", query] as const,
  },

  admin: {
    all: ["admin"] as const,
    users: (query: AdminUserListQuery = {}) => ["admin", "users", query] as const,
    dashboardStats: () => ["admin", "dashboard-stats"] as const,
    auditLogs: (query: AuditLogQuery = {}) => ["admin", "audit-logs", query] as const,
  },

  notifications: {
    all: ["notifications"] as const,
    mine: (query: NotificationQuery = {}) => ["notifications", "mine", query] as const,
  },
} as const;
