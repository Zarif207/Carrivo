import Link from "next/link";
import { Button } from "@/components/ui/button";

// Temporary home so the public layout can be checked. Replaced by the real home page in Phase 2.
export default function HomePage() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="max-w-3xl space-y-6">
        <h1 className="font-display text-display-1">Every parcel, stop by stop.</h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          Book a courier, pay online and follow your parcel from pickup to the receiver&rsquo;s door.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg" variant="signal">
            <Link href="/register">Send a parcel</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/track">Track a parcel</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
