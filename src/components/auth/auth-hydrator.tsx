"use client";

// Client: seeds the auth store with the user the server already verified (no extra request).
import { useEffect } from "react";
import { toSessionUser, useAuthStore } from "@/stores/auth-store";
import type { User } from "@/types";

export function AuthHydrator({ user }: { user: User }) {
  const setUser = useAuthStore((state) => state.setUser);
  useEffect(() => {
    setUser(toSessionUser(user));
  }, [user, setUser]);
  return null;
}
