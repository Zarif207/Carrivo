import { EyeOff, MapPin, Route } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/public/section";
import { TrackingForm } from "@/components/public/tracking-form";
import { EXAMPLE_TRACKING_ID } from "@/config/site";

export const metadata: Metadata = {
  title: "Track a parcel",
  description: "Enter a Carrivo tracking ID to see where a parcel is and every stop it has made.",
  alternates: { canonical: "/track" },
  openGraph: { title: "Track a Carrivo parcel", url: "/track" },
};

const NOTES = [
  { icon: <Route />, text: "Every stop since booking, newest first" },
  { icon: <MapPin />, text: "The city of each hub, not street addresses" },
  { icon: <EyeOff />, text: "No names, phone numbers or prices, so it's safe to share the ID" },
];

export default function TrackPage() {
  return (
    <section className="pt-14 pb-20 sm:pt-20 sm:pb-24">
      <Container className="max-w-3xl space-y-8">
        <div className="space-y-5">
          <h1 className="font-display text-display-1">Where&rsquo;s my parcel?</h1>
          <p className="text-xl text-muted-foreground">Enter the tracking ID from your booking or the sender&rsquo;s message.</p>
        </div>
        <TrackingForm
          hint={
            <>
              Tracking IDs start with CRV. Try the demo parcel{" "}
              <Link href={`/track/${EXAMPLE_TRACKING_ID}`} className="font-id font-semibold text-foreground underline underline-offset-4">
                {EXAMPLE_TRACKING_ID}
              </Link>
              .
            </>
          }
        />
        <ul className="grid gap-3 sm:grid-cols-3">
          {NOTES.map((note) => (
            <li key={note.text} className="flex items-start gap-3 rounded-xl bg-surface p-4 text-sm [&_svg]:size-5 [&_svg]:shrink-0">
              {note.icon}
              {note.text}
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
