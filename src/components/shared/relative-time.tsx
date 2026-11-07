"use client";

// Client: "3 hours ago" depends on the viewer's clock, so it is computed after mount
// (server and first client render show the absolute time; no hydration mismatch).
import { useEffect, useState } from "react";
import { formatDateTime, formatRelative } from "@/lib/format";

export function RelativeTime({ value, className }: { value: string; className?: string }) {
  const [relative, setRelative] = useState<string | null>(null);

  useEffect(() => {
    const update = () => setRelative(formatRelative(value));
    update();
    const timer = setInterval(update, 60_000);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <time dateTime={value} title={formatDateTime(value)} className={className}>
      {relative ?? formatDateTime(value)}
    </time>
  );
}
