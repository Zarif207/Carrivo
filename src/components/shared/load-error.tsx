"use client";

// Client: raises a toast once when a server-rendered section couldn't load its data.
import { CloudOff, RotateCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface LoadErrorProps {
  /** What failed, e.g. "Your shipments". */
  what: string;
  /** The API's message, when there is one. */
  message?: string;
}

/** Inline card + error toast for a section whose API call failed. "Try again" re-runs the server render. */
export function LoadError({ what, message }: LoadErrorProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const shown = useRef(false);

  useEffect(() => {
    if (shown.current) return;
    shown.current = true;
    toast.error(`${what} couldn't be loaded.`, { description: message });
  }, [what, message]);

  return (
    <div role="alert" className="flex flex-col items-center gap-4 rounded-xl bg-card px-6 py-12 text-center shadow-card">
      <span className="grid size-14 place-items-center rounded-full bg-danger-soft text-danger">
        <CloudOff className="size-7" aria-hidden="true" />
      </span>
      <div className="max-w-sm space-y-1">
        <h2 className="text-lg font-bold">{what} couldn&rsquo;t be loaded</h2>
        <p className="text-sm text-muted-foreground">{message ?? "Check your connection, then try again."}</p>
      </div>
      <Button variant="outline" onClick={() => startTransition(() => router.refresh())} disabled={pending}>
        <RotateCw className={pending ? "animate-spin" : undefined} aria-hidden="true" /> Try again
      </Button>
    </div>
  );
}
