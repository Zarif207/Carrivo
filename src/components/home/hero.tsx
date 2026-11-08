import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Container } from "@/components/public/section";
import { TrackingForm } from "@/components/public/tracking-form";
import { Button } from "@/components/ui/button";
import { EXAMPLE_TRACKING_ID } from "@/config/site";
import { Magnetic } from "./magnetic";
import { RouteVisual } from "./route-visual";

const HEADLINE = "Door-to-door delivery, tracked at every stop.";

/**
 * Server component. The headline is in the HTML from the first byte (it is the LCP element); its
 * staggered rise is a CSS transform only, so it is never invisible and never waits for JS.
 * Screen readers get the sentence once (the animated word spans are aria-hidden).
 */
export function Hero() {
  const words = HEADLINE.split(" ");
  return (
    <section
      id="hero"
      data-nav-section="/track"
      aria-labelledby="hero-heading"
      className="relative overflow-hidden pt-10 pb-16 sm:pt-14 lg:pt-16 lg:pb-24"
    >
      <div aria-hidden="true" className="pointer-events-none absolute -top-48 -left-40 size-[42rem] rounded-full bg-brand-soft opacity-70 blur-3xl dark:opacity-30" />
      <Container className="relative grid items-center gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-14">
        <div className="space-y-8">
          <div className="space-y-5">
            <h1 id="hero-heading" className="font-display text-display-1 tracking-[-0.035em] lg:text-[3.9rem] xl:text-[4.6rem]">
              <span className="sr-only">{HEADLINE}</span>
              <span aria-hidden="true">
                {words.map((word, i) => (
                  <span key={`${word}-${i}`} className="animate-word-rise" style={{ ["--i" as string]: i }}>
                    {word}
                    {i < words.length - 1 ? " " : null}
                  </span>
                ))}
              </span>
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground sm:text-xl">
              Book a courier in minutes, pay securely by card, and follow your parcel through every hub to the receiver&rsquo;s door, with a photo
              when it&rsquo;s handed over.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Magnetic>
              <Button asChild size="lg">
                <Link href="/register">
                  Send a parcel <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </Magnetic>
            <Magnetic>
              <Button asChild size="lg" variant="outline">
                <Link href="/pricing">Get a price</Link>
              </Button>
            </Magnetic>
          </div>

          <TrackingForm
            className="max-w-xl"
            hint={
              <>
                Try the demo parcel{" "}
                <Link href={`/track/${EXAMPLE_TRACKING_ID}`} className="font-id font-semibold text-foreground underline underline-offset-4">
                  {EXAMPLE_TRACKING_ID}
                </Link>
              </>
            }
          />
        </div>

        <RouteVisual />
      </Container>
    </section>
  );
}
