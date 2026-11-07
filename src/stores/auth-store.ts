"use client";

import { create } from "zustand";
import type { Role } from "@/types";

/** Non-sensitive profile fields only. The token never reaches the browser. */
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  image: string | null;
}

type AuthStatus = "unknown" | "authenticated" | "anonymous";

interface AuthState {
  user: SessionUser | null;
  status: AuthStatus;
  setUser: (user: SessionUser | null) => void;
}

/** In memory only (no persistence), so nothing about the session sits in localStorage. */
export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  status: "unknown",
  setUser: (user) => set({ user, status: user ? "authenticated" : "anonymous" }),
}));

export const toSessionUser = (user: { id: string; name: string; email: string; role: Role; image: string | null }): SessionUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  image: user.image,
});
