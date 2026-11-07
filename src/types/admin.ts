import type { Currency, DateFilter, ISODateString, Id, JsonObject, ListQuery, Money, PageQuery } from "./common";
import type {
  AuditAction,
  AuditEntityType,
  PaymentStatus,
  Role,
  ShipmentStatus,
  UserStatus,
  VehicleType,
} from "./enums";
import type { UserProfile } from "./user";

/* ── Users ── */

export type AdminUser = UserProfile;

export type AdminUserListQuery = ListQuery<"name" | "email" | "createdAt" | "role" | "status"> & {
  role?: Role;
  status?: UserStatus;
};

export type CourierProfileInput = {
  zoneId: Id;
  /** Must be an active hub inside zoneId. */
  hubId?: Id | null;
  vehicleType: VehicleType;
  vehicleNumber?: string | null;
  licenseNumber?: string | null;
};

/** POST /admin/users: COURIER (courierProfile required) or ADMIN (courierProfile forbidden). */
export type CreateUserInput =
  | {
      role: "COURIER";
      name: string;
      email: string;
      password: string;
      phone?: string;
      courierProfile: CourierProfileInput;
    }
  | {
      role: "ADMIN";
      name: string;
      email: string;
      password: string;
      phone?: string;
    };

/** PATCH /admin/users/:id/role. courierProfile only when role is COURIER (needed unless a retired profile exists). */
export type ChangeRoleInput = {
  role: Role;
  courierProfile?: CourierProfileInput;
};

/** PATCH /admin/users/:id/status. Deactivation revokes all sessions. */
export type ChangeUserStatusInput = {
  status: UserStatus;
  reason?: string;
};

/* ── Dashboard ── */

/** GET /admin/dashboard-stats (cached 60 s on the API). */
export interface DashboardStats {
  shipments: {
    total: number;
    byStatus: Record<ShipmentStatus, number>;
  };
  revenue: {
    currency: Currency;
    /** PAID + REFUND_PENDING + REFUNDED payments. */
    grossCollected: Money;
    refunded: Money;
    net: Money;
  };
  /** Zero-filled. */
  paymentsByStatus: Record<PaymentStatus, number>;
  /** One entry per day (counts only; no revenue per day). */
  shipmentsPerDay: { date: string; count: number }[];
  topCouriers: { id: Id; name: string; deliveries: number }[];
  failedDeliveryRate: {
    /** 0..1 = failed attempts / (failed attempts + delivered). */
    rate: number;
    failedAttempts: number;
    deliveredShipments: number;
  };
  counts: {
    activeCouriers: number;
    activeCustomers: number;
    activeHubs: number;
  };
  generatedAt: ISODateString;
}

/* ── Audit logs ── */

export interface AuditLog {
  id: Id;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  /** null for system actions. */
  actorRole: Role | null;
  actor: { id: Id; name: string; email: string; role: Role } | null;
  /** Redacted snapshots (password/token/secret/hash keys removed). */
  before: JsonObject | null;
  after: JsonObject | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: ISODateString;
}

/** Newest first by default. No sortBy / searchTerm. */
export type AuditLogQuery = PageQuery & {
  actorId?: Id;
  action?: AuditAction;
  entityType?: AuditEntityType;
  entityId?: string;
  fromDate?: DateFilter;
  toDate?: DateFilter;
};
