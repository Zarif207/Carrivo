"use client";

// Client: error boundaries must be client components.
import { AreaError } from "@/components/layout/area-error";

export default function CourierError(props: { error: Error & { digest?: string }; retry: () => void }) {
  return <AreaError {...props} />;
}
