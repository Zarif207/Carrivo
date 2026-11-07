import { PackageX } from "lucide-react";
import { TrackingForm } from "@/components/public/tracking-form";

export default function TrackingNotFound() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <span className="grid size-14 place-items-center rounded-full border-2 border-dashed border-border text-muted-foreground">
        <PackageX className="size-7" aria-hidden="true" />
      </span>
      <div className="space-y-3">
        <h1 className="font-display text-display-2">We can&rsquo;t find that parcel</h1>
        <p className="text-lg text-muted-foreground">
          No shipment has this tracking ID. Check it against the booking message, or ask the sender to send it again. New bookings appear as soon as they&rsquo;re made.
        </p>
      </div>
      <TrackingForm />
    </div>
  );
}
