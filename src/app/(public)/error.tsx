"use client";

// Client: error boundaries must be client components (they receive retry()).
import { RotateCw, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Container } from "@/components/public/section";
import { Button } from "@/components/ui/button";

export default function PublicError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="py-24">
      <Container className="max-w-2xl space-y-6">
        <span className="grid size-14 place-items-center rounded-full bg-danger-soft text-danger">
          <TriangleAlert className="size-7" aria-hidden="true" />
        </span>
        <div className="space-y-3">
          <h1 className="font-display text-display-2">This page didn&rsquo;t load</h1>
          <p className="text-lg text-muted-foreground">
            Something went wrong on our side. Try again, and if it keeps happening, come back in a few minutes.
          </p>
          {error.digest ? <p className="font-id text-sm text-muted-foreground">Reference: {error.digest}</p> : null}
        </div>
        <div className="flex flex-wrap gap-3">
          <Button size="lg" onClick={() => retry()}>
            <RotateCw aria-hidden="true" /> Try again
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/">Go to the home page</Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
