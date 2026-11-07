import { Clock3, Mail, PackageSearch } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ContactForm } from "@/components/public/contact-form";
import { CoverageList, CoverageSkeleton } from "@/components/public/live-data";
import { Container, Section } from "@/components/public/section";
import { SITE } from "@/config/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Email the Carrivo support team about a booking, a parcel on the way, payments or regular shipping for your business.",
  alternates: { canonical: "/contact" },
  openGraph: { title: "Contact Carrivo", url: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <section className="pt-14 pb-16 sm:pt-20">
        <Container className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-12">
          <div className="space-y-8">
            <div className="space-y-5">
              <h1 className="font-display text-display-1">Talk to us.</h1>
              <p className="max-w-xl text-xl text-muted-foreground">
                Questions about a booking, a parcel on the way or a refund? Write to us and include your tracking ID if you have one.
              </p>
            </div>
            <ContactForm to={SITE.contactEmail} />
          </div>

          <aside className="space-y-4 lg:pt-4" aria-label="Contact details">
            <div className="space-y-3 rounded-2xl bg-card p-6 shadow-card">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <Mail className="size-5" aria-hidden="true" /> Email
              </h2>
              <a href={`mailto:${SITE.contactEmail}`} className="block text-lg font-semibold break-all text-brand-text underline-offset-4 hover:underline">
                {SITE.contactEmail}
              </a>
              <p className="text-sm text-muted-foreground">Include your tracking ID so we can find the parcel quickly.</p>
            </div>
            <div className="space-y-3 rounded-2xl bg-card p-6 shadow-card">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <Clock3 className="size-5" aria-hidden="true" /> Support hours
              </h2>
              <dl className="space-y-2">
                {SITE.supportHours.map((row) => (
                  <div key={row.days} className="flex flex-wrap justify-between gap-x-4">
                    <dt className="text-muted-foreground">{row.days}</dt>
                    <dd className="font-semibold">{row.hours}</dd>
                  </div>
                ))}
              </dl>
              <p className="text-sm text-muted-foreground">{SITE.timeZoneLabel}</p>
            </div>
            <div className="space-y-3 rounded-2xl bg-ink p-6 text-ink-foreground">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <PackageSearch className="size-5" aria-hidden="true" /> Where&rsquo;s my parcel?
              </h2>
              <p className="text-sidebar-muted">The tracking page shows the latest stop straight away, any time of day.</p>
              <Link href="/track" className="inline-block font-semibold text-sidebar-foreground underline underline-offset-4">
                Track a parcel
              </Link>
            </div>
          </aside>
        </Container>
      </section>

      <Section id="hubs" title="Our hubs" intro="Drop by or call a hub about a parcel that's already in our network." className="pt-0 sm:pt-0 lg:pt-0">
        <Suspense fallback={<CoverageSkeleton />}>
          <CoverageList showCta={false} />
        </Suspense>
      </Section>
    </>
  );
}
