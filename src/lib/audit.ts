import { PAYMENT_STATUS_META, SHIPMENT_STATUS_META, USER_STATUS_META } from "@/lib/status";
import type { AuditAction, AuditEntityType, AuditLog, PaymentStatus, ShipmentStatus, UserStatus } from "@/types";

/** "SHIPMENT_STATUS_CHANGED" → "Shipment status changed" (plain words, no enum casing). */
export function auditActionLabel(action: AuditAction): string {
  const overrides: Partial<Record<AuditAction, string>> = {
    DEV_MARK_PAID: "Marked paid (dev tool)",
    USER_PASSWORD_RESET_BY_SEED: "Password reset by seed",
    USER_REGISTERED_GOOGLE: "Signed up with Google",
    USER_LOGIN_GOOGLE: "Signed in with Google",
    USER_LOGIN_REFUSED: "Sign-in refused",
    PRICING_RULE_CREATED: "Pricing rule created",
    PRICING_RULE_UPDATED: "Pricing rule updated",
    PRICING_RULE_DELETED: "Pricing rule deleted",
    COURIER_AVAILABILITY_CHANGED: "Courier availability changed",
  };
  if (overrides[action]) return overrides[action];
  const words = action.toLowerCase().split("_");
  return [words[0][0].toUpperCase() + words[0].slice(1), ...words.slice(1)].join(" ");
}

export const AUDIT_ENTITY_LABELS: Record<AuditEntityType, string> = {
  ZONE: "Zone",
  HUB: "Hub",
  PRICING_RULE: "Pricing rule",
  SHIPMENT: "Shipment",
  COURIER_PROFILE: "Courier profile",
  USER: "User",
  PAYMENT: "Payment",
};

/** Where an audit entry's subject lives in the admin area (null when there's no page for it). */
export function auditEntityHref(log: Pick<AuditLog, "entityType" | "entityId">): string | null {
  switch (log.entityType) {
    case "SHIPMENT":
      return `/admin/shipments/${log.entityId}`;
    case "USER":
      return `/admin/users?view=${log.entityId}`;
    case "ZONE":
      return "/admin/settings?tab=zones";
    case "HUB":
      return "/admin/settings?tab=hubs";
    case "PRICING_RULE":
      return "/admin/settings?tab=pricing";
    default:
      return null;
  }
}

/**
 * A short subject: a name, tracking id or code from the snapshots when present, otherwise the record
 * type plus the last 6 characters of its id (snapshots often hold only the changed fields).
 */
export function auditSubject(log: Pick<AuditLog, "entityType" | "entityId" | "before" | "after">): string {
  const snap = { ...(log.before ?? {}), ...(log.after ?? {}) } as Record<string, unknown>;
  for (const key of ["trackingId", "name", "email", "code"]) {
    const value = snap[key];
    if (typeof value === "string" && value) return value;
  }
  return `${AUDIT_ENTITY_LABELS[log.entityType]} …${log.entityId.slice(-6).toUpperCase()}`;
}

const statusLabel = (type: AuditEntityType, value: unknown): string | null => {
  if (typeof value !== "string") return null;
  if (type === "SHIPMENT" && value in SHIPMENT_STATUS_META) return SHIPMENT_STATUS_META[value as ShipmentStatus].label;
  if (type === "PAYMENT" && value in PAYMENT_STATUS_META) return PAYMENT_STATUS_META[value as PaymentStatus].label;
  if (type === "USER" && value in USER_STATUS_META) return USER_STATUS_META[value as UserStatus].label;
  return null;
};

/** One plain line about what changed, read from the before/after snapshots (null if nothing useful). */
export function auditDetail(log: Pick<AuditLog, "entityType" | "before" | "after">): string | null {
  const before = (log.before ?? {}) as Record<string, unknown>;
  const after = (log.after ?? {}) as Record<string, unknown>;
  const from = statusLabel(log.entityType, before.status);
  const to = statusLabel(log.entityType, after.status);
  if (to && from && from !== to) return `${from} to ${to}`;
  if (typeof after.isAvailable === "boolean") return after.isAvailable ? "Now available" : "Now paused";
  if ("replaced" in after) return after.replaced ? "Photo replaced" : "Photo added";
  if (to) return `Now ${to.toLowerCase()}`;
  return null;
}
