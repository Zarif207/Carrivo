import type { ISODateString, Id } from "./common";
import type { User } from "./user";

/** POST /auth/register (always creates a CUSTOMER; unknown keys such as `role` → 400). */
export type RegisterInput = {
  name: string;
  email: string;
  password: string;
  phone?: string;
};

/** POST /auth/login */
export type LoginInput = {
  email: string;
  password: string;
};

/** POST /auth/google/exchange */
export type GoogleExchangeInput = {
  code: string;
  codeVerifier: string;
};

/** data of login, register and Google exchange. The token stays on the server (httpOnly cookie). */
export interface AuthResult {
  token: string;
  expiresAt: ISODateString;
  user: User;
}

/** data of POST /auth/refresh-token (the old token is revoked). */
export interface RefreshResult {
  token: string;
  expiresAt: ISODateString;
}

/** POST /auth/change-password (Better Auth endpoint). */
export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
  revokeOtherSessions?: boolean;
};

/** Better Auth's own response shape: NOT wrapped in the usual envelope. */
export interface ChangePasswordResult {
  token: string | null;
  user: { id: Id; email: string; name: string };
}
