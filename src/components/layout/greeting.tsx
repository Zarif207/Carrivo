"use client";

// Client: reads the signed-in user's first name from the auth store (seeded by the layout).
import { useAuth } from "@/hooks/use-auth";

export function Greeting({ fallback }: { fallback: string }) {
  const { user } = useAuth();
  const firstName = user?.name.split(" ")[0];
  return <>{firstName ? `Hello, ${firstName}` : fallback}</>;
}
