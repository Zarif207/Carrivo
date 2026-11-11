import { ArrowRight, CalendarDays, MapPinned, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { FeatureCard, Section } from "@/components/public/section";
import { Button } from "@/components/ui/button";
import { COURIER_APPLICATION_PATH } from "@/config/nav";

/**
 * "Become a courier" on the home page (server component, static). The link goes to
 * /courier-application: visitors are sent to log in first and come straight back.
 */
export function DriveWithUs() {
  return (
    <Section
      id="drive"
      title="Deliver with Carrivo"
      intro="Have a bike, car or van and some free days? Customers can apply to become couriers. An admin reviews every application."
      action={
        <Button asChild size="lg">
          <Link href={COURIER_APPLICATION_PATH}>
            Become a courier <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      }
    >
      <div className="grid gap-5 md:grid-cols-3">
        <FeatureCard icon={<CalendarDays />} title="Work the days you choose">
          <p>Weekdays, weekends or full time: tell us when you&rsquo;re free when you apply.</p>
        </FeatureCard>
        <FeatureCard icon={<MapPinned />} title="Deliver where you live">
          <p>Pick the metro zone you know best. You&rsquo;re assigned parcels picked up in your zone.</p>
        </FeatureCard>
        <FeatureCard icon={<ShieldCheck />} title="A short, private form">
          <p>Your vehicle, availability and a few words about yourself. No licence or Social Security numbers.</p>
        </FeatureCard>
      </div>
    </Section>
  );
}
