"use client";

import { useCallback, useEffect } from "react";
import { ApiError } from "@/lib/api/errors";
import { toSessionUser, useAuthStore, type SessionUser } from "@/stores/auth-store";
import type { Role, User } from "@/types";
import type { LoginValues } from "@/lib/validation/auth";

interface SignedIn {
  user: User;
  redirectTo: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

async function postAuth<T>(path: string, body: object): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      credentials: "same-origin",
    });
  } catch {
    throw new ApiError(0, "Could not reach the server. Check your connection and try again.");
  }
  let json: unknown = null;
  try {
    json = await response.json();
  } catch {
    json = null;
  }
  if (!response.ok || (isRecord(json) && json.success === false)) throw ApiError.fromBody(response.status, json);
  return (isRecord(json) ? json.data : json) as T;
}

let meRequest: Promise<SessionUser | null> | null = null;

/** Loads the current user once per page (shared by every component that asks). */
function loadMe(): Promise<SessionUser | null> {
  meRequest ??= fetch("/api/auth/me", { credentials: "same-origin", headers: { Accept: "application/json" } })
    .then(async (response) => {
      if (!response.ok) return null;
      const json: unknown = await response.json();
      const user = isRecord(json) && isRecord(json.data) ? (json.data.user as User | undefined) : undefined;
      return user ? toSessionUser(user) : null;
    })
    .catch(() => null);
  return meRequest;
}

export interface RegisterInputValues {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

/**
 * Session state and actions for client components. Sign-in calls go to /api/auth/*, which set the
 * httpOnly cookies; after success we do a full navigation so every server component re-renders
 * with the new session.
 */
export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    if (status !== "unknown") return;
    let active = true;
    void loadMe().then((me) => {
      if (active) setUser(me);
    });
    return () => {
      active = false;
    };
  }, [status, setUser]);

  const finishSignIn = useCallback(
    (result: SignedIn) => {
      setUser(toSessionUser(result.user));
      window.location.assign(result.redirectTo);
      return result;
    },
    [setUser],
  );

  const login = useCallback(
    async (values: LoginValues, next?: string | null) => finishSignIn(await postAuth<SignedIn>("/api/auth/login", { ...values, next: next ?? undefined })),
    [finishSignIn],
  );

  const register = useCallback(
    async (values: RegisterInputValues, next?: string | null) =>
      finishSignIn(await postAuth<SignedIn>("/api/auth/register", { ...values, next: next ?? undefined })),
    [finishSignIn],
  );

  const demoLogin = useCallback(
    async (role: Role, next?: string | null) => finishSignIn(await postAuth<SignedIn>("/api/auth/demo", { role, next: next ?? undefined })),
    [finishSignIn],
  );

  const logout = useCallback(async () => {
    try {
      await postAuth("/api/auth/logout", {});
    } finally {
      setUser(null);
      meRequest = null;
      // Full replace: drops the client router cache so Back can't show the old dashboard.
      window.location.replace("/login?reason=logged-out");
    }
  }, [setUser]);

  return { user, status, isAuthenticated: status === "authenticated", login, register, demoLogin, logout };
}
