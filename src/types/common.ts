import type { Role, SortOrder } from "./enums";

/** ISO 8601 date-time string as returned by the API, e.g. "2026-11-06T04:49:24.456Z". */
export type ISODateString = string;

/** USD amount as a 2-decimal string, e.g. "6.00". Never cents, never a number. */
export type Money = string;

/** Prisma Decimal serialized as a string without fixed scale, e.g. weightLb "5.5" or baseWeightLb "2". */
export type DecimalString = string;

/** UUID (v7 for domain rows, v4 for users). */
export type Id = string;

/** The API's only currency value. */
export type Currency = "usd";

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };

/* ── Small embedded references the API reuses everywhere ── */

export interface ZoneRef {
  id: Id;
  name: string;
  code: string;
}

export interface HubRef {
  id: Id;
  name: string;
  code: string;
  city: string;
}

export interface PersonRef {
  id: Id;
  name: string;
}

export interface ActorRef extends PersonRef {
  role: Role;
}

/**
 * Query keys every list endpoint accepts. `limit` max 100 (default 10), `sortOrder` default "desc",
 * `searchTerm` 1-100 chars. Empty values are treated as "not provided" by the API.
 */
export type ListQuery<TSortBy extends string = string> = {
  page?: number;
  limit?: number;
  sortBy?: TSortBy;
  sortOrder?: SortOrder;
  searchTerm?: string;
};

/** List endpoints without `searchTerm` / `sortBy` (payments/my, notifications, audit logs). */
export type PageQuery = {
  page?: number;
  limit?: number;
  sortOrder?: SortOrder;
};

/** `YYYY-MM-DD` (America/New_York calendar day) or a full ISO date-time with offset. */
export type DateFilter = string;
