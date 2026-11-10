import type { ISODateString, Id, PageQuery } from "./common";
import type { NotificationType } from "./enums";

/** Named AppNotification to avoid shadowing the DOM's global `Notification`. */
export interface AppNotification {
  id: Id;
  type: NotificationType;
  title: string;
  /** Plain text. May contain user-entered characters such as "<b>": render as text, never as HTML. */
  message: string;
  /**
   * In-app path to open (e.g. "/admin/shipments/<id>", "/admin/payments?status=FAILED").
   * Null on rows written before the API stored links. Always pass it through safeInternalPath().
   */
  link: string | null;
  readAt: ISODateString | null;
  createdAt: ISODateString;
  shipment: { id: Id; trackingId: string } | null;
  isRead: boolean;
}

/** `unread`: "true" = unread only, "false" = read only, omit = all. */
export type NotificationQuery = PageQuery & {
  unread?: "true" | "false";
};

/** data of GET /notifications/unread-count (the caller's own rows) */
export interface UnreadCount {
  unread: number;
  total: number;
}

/** data of DELETE /notifications/:id */
export interface DeletedNotification {
  id: Id;
}

/** data of PATCH /notifications/read-all */
export interface MarkAllReadResult {
  updated: number;
}

/** data of GET /health */
export interface HealthStatus {
  status: "ok";
  environment: string;
  uptime: number;
  timestamp: ISODateString;
  database: "up" | "down";
}
