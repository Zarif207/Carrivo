import { ArrowRight, ClipboardList, IdCard } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ApplicationSkeleton } from "@/components/courier-application/application-skeleton";
import { CourierApplicationView } from "@/components/courier-application/application-view";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { ADMIN_COURIER_APPLICATIONS } from "@/config/nav";
import { requireSignedIn } from "@/lib/auth/current-user";
import { isStaff } from "@/lib/auth/permissions";
import { getPublicZones } from "@/lib/data/public";

export const metadata: Metadata = {
  title: "Become a courier",
  description: "Apply to deliver parcels with Carrivo in your metro area.",
  robots: { index: false },
};

const STEPS = [
  { title: "Apply", text: "Tell us your vehicle, the days you can work and where you'd like to deliver." },
  { title: "We review it", text: "An admin reads every application, usually within a few days. You'll get a notification and an email." },
  { title: "Sign in as a courier", text: "Once approved you're signed out everywhere. Sign in again to see your courier dashboard." },
];

function HowItWorks() {
  return (
    <aside aria-labelledby="how-heading" className="space-y-5 rounded-xl bg-card p-6 shadow-card lg:sticky lg:top-6">
      <h2 id="how-heading" className="text-lg font-bold tracking-tight">
        How it works
      </h2>
      <ol className="space-y-4">
        {STEPS.map((step, i) => (
          <li key={step.title} className="flex gap-3">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-ink text-xs font-bold text-ink-foreground tabular dark:bg-white/10">{i + 1}</span>
            <div className="space-y-0.5">
              <p className="font-semibold">{step.title}</p>
              <p className="text-sm text-muted-foreground">{step.text}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="flex items-start gap-2 border-t border-border pt-4 text-sm text-muted-foreground">
        <IdCard className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        We never ask for a driver&rsquo;s licence, Social Security or other ID number in this form.
      </p>
    </aside>
  );
}

/** Admins and viewers land here from links too: point them at the review queue instead. */
function StaffNotice() {
  return (
    <section className="max-w-2xl space-y-4 rounded-xl bg-card p-6 shadow-card sm:p-8">
      <h2 className="font-display text-xl font-bold tracking-tight">Courier applications are for customer accounts</h2>
      <p className="text-muted-foreground">Staff accounts can&rsquo;t apply. You can review the applications customers send in the admin area.</p>
      <Button asChild>
        <Link href={ADMIN_COURIER_APPLICATIONS}>
          <ClipboardList aria-hidden="true" /> Review applications <ArrowRight aria-hidden="true" />
        </Link>
      </Button>
    </section>
  );
}

async function Content() {
  const user = await requireSignedIn();
  if (isStaff(user.role)) return <StaffNotice />;
  // Cached public read; a failure only means the zone list is empty ("No preference" still works).
  const zones = await getPublicZones().catch(() => []);
  const role = user.role === "COURIER" ? "COURIER" : "CUSTOMER";
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
      <CourierApplicationView role={role} zones={zones.map(({ id, name }) => ({ id, name }))} defaultPhone={user.phone ?? null} />
      {role === "CUSTOMER" ? <HowItWorks /> : null}
    </div>
  );
}

export default function CourierApplicationPage() {
  return (
    <>
      <PageHeader title="Become a courier" description="Deliver parcels in your city with Carrivo, on the days that suit you." />
      <Suspense fallback={<ApplicationSkeleton />}>
        <Content />
      </Suspense>
    </>
  );
}
