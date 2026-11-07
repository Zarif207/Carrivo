"use client";

// Client: error boundaries receive retry() and must be client components.
import { RotateCw, TriangleAlert } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/** Shared error.tsx body for the customer, courier and admin areas (shown inside the shell). */
export function AreaError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl space-y-5 py-16 text-center" role="alert">
      <span className="mx-auto grid size-14 place-items-center rounded-full bg-danger-soft text-danger">
        <TriangleAlert className="size-7" aria-hidden="true" />
      </span>
      <div className="space-y-2">
        <h1 className="font-display text-display-3">This page didn&rsquo;t load</h1>
        <p className="text-muted-foreground">Something went wrong while loading your data. Try again in a moment.</p>
        {error.digest ? <p className="font-id text-sm text-muted-foreground">Reference: {error.digest}</p> : null}
      </div>
      <Button onClick={() => retry()} size="lg">
        <RotateCw aria-hidden="true" /> Try again
      </Button>
    </div>
  );
}
