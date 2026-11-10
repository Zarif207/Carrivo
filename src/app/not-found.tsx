import { Compass } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PublicSiteHeader } from "@/components/layout/public-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/public/section";
import { TrackingForm } from "@/components/public/tracking-form";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

/** Root 404: rendered outside the (public) layout, so it adds the site header and footer itself. */
export default function NotFound() {
  return (
    <>
      <PublicSiteHeader />
      <main id="main" className="flex-1 py-20 sm:py-24">
        <Container className="max-w-2xl space-y-8">
          <span className="grid size-14 place-items-center rounded-full border-2 border-dashed border-border text-muted-foreground">
            <Compass className="size-7" aria-hidden="true" />
          </span>
          <div className="space-y-3">
            <h1 className="font-display text-display-2">This page doesn&rsquo;t exist</h1>
            <p className="text-lg text-muted-foreground">The link may be old or mistyped. If you&rsquo;re looking for a parcel, track it below.</p>
          </div>
          <TrackingForm />
          <Button asChild size="lg" variant="outline">
            <Link href="/">Go to the home page</Link>
          </Button>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
