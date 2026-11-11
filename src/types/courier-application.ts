import type { ISODateString, Id, ListQuery, PersonRef, ZoneRef } from "./common";
import type { CourierApplicationStatus, Role, UserStatus, VehicleType, WorkAvailability } from "./enums";

/*
 * Courier applications (backend docs/api.md → "Courier applications"). A CUSTOMER applies; an ADMIN
 * approves (the user becomes a COURIER and is signed out everywhere) or rejects with a note.
 * No licence, SSN or other government ID is ever collected.
 */

/** What the applicant sees (never who reviewed it). */
export interface CourierApplication {
  id: Id;
  status: CourierApplicationStatus;
  phone: string;
  vehicleType: VehicleType;
  vehiclePlate: string | null;
  availability: WorkAvailability;
  experience: string | null;
  about: string | null;
  /** The admin's note; set on a rejection. */
  reviewNote: string | null;
  reviewedAt: ISODateString | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  preferredZone: ZoneRef | null;
}

/** Staff view: adds the applicant's account and the reviewer. */
export interface AdminCourierApplication extends CourierApplication {
  user: { id: Id; name: string; email: string; phone: string | null; role: Role; status: UserStatus };
  reviewedBy: PersonRef | null;
}

/** GET /courier-applications/my */
export interface MyCourierApplications {
  latest: CourierApplication | null;
  /** Newest first, up to 20, latest included. */
  history: CourierApplication[];
  canApply: boolean;
  /** Set while the wait after a rejection runs. */
  canReapplyAt: ISODateString | null;
  /** Why the caller can't apply right now. */
  blockedReason: string | null;
  cooldownDays: number;
}

export type CourierApplicationSortBy = "createdAt" | "updatedAt" | "status";

export type CourierApplicationListQuery = ListQuery<CourierApplicationSortBy> & {
  status?: CourierApplicationStatus;
  /** The applicant's preferred zone. */
  zoneId?: Id;
  vehicleType?: VehicleType;
};

/** POST /courier-applications */
export interface CourierApplicationInput {
  phone: string;
  vehicleType: VehicleType;
  availability: WorkAvailability;
  preferredZoneId?: Id | null;
  vehiclePlate?: string | null;
  experience?: string | null;
  about?: string | null;
}

/** PATCH /admin/courier-applications/:id/approve (both optional; the zone defaults to the preferred one). */
export interface ApproveCourierApplicationInput {
  zoneId?: Id;
  hubId?: Id | null;
}

/** PATCH /admin/courier-applications/:id/reject */
export interface RejectCourierApplicationInput {
  note: string;
}
