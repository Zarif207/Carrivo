"use client";

// Client: error boundaries must be client components (they receive retry()).
// Catches errors from the area layouts themselves (e.g. the session check timing out or being rate
// limited), which their own error.tsx can't see, so the visitor keeps a working "Try again".
import { AreaError } from "@/components/layout/area-error";

export default function RootError(props: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main className="min-h-dvh bg-background px-4">
      <AreaError {...props} />
    </main>
  );
}
