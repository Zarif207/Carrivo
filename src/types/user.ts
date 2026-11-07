import type { HubRef, ISODateString, Id, ZoneRef } from "./common";
import type { Role, UserStatus, VehicleType } from "./enums";

/** Safe user fields (login/register/Google responses). */
export interface User {
  id: Id;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role: Role;
  status: UserStatus;
  phone: string | null;
  address: string | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface CourierProfile {
  id: Id;
  vehicleType: VehicleType;
  vehicleNumber: string | null;
  isAvailable: boolean;
  zone: ZoneRef;
  /** GET /users/me leaves out `city` here (contract §9.13); other responses include it. */
  hub: (Omit<HubRef, "city"> & { city?: string }) | null;
}

/** GET/PATCH /users/me and admin user rows: user + courier profile (null unless COURIER). */
export interface UserProfile extends User {
  courierProfile: CourierProfile | null;
}

/** PATCH /users/me. Whitelisted fields only; send null to clear phone/address/image. */
export type UpdateProfileInput = {
  name?: string;
  phone?: string | null;
  address?: string | null;
  image?: string | null;
};
