import { ArrowRight, CalendarDays, CircleCheckBig, Clock3, EyeOff, Package } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Container } from "@/components/public/section";
import { TrackingForm } from "@/components/public/tracking-form";
import { StatusBadge } from "@/components/shared/status-badge";
import { Timeline, fromTrackingTimeline } from "@/components/shared/timeline";
import { getTracking } from "@/lib/data/public";
import { formatDate, formatDateTime } from "@/lib/format";
import { SERVICE_NAMES, SHIPMENT_STATUS_META } from "@/lib/status";
import { TRACKING_ID_PATTERN, normalizeTrackingId } from "@/lib/validation/public";
import type { TrackingInfo } from "@/types";
import { TrackingResultSkeleton } from "./tracking-skeleton";

type Props = PageProps<"/track/[trackingId]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = normalizeTrackingId(decodeURIComponent((await params).trackingId));
  return {
    title: `Tracking ${id}`,
    description: `Latest status and every stop for Carrivo parcel ${id}.`,
    // Personal lookups: keep them out of search results.
    robots: { index: false, follow: true },
  };
}

function InvalidId({ id }: { id: string }) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h1 className="font-display text-display-2">That isn&rsquo;t a tracking ID</h1>
        <p className="text-lg text-muted-foreground">
          <span className="font-id break-all">{id}</span> doesn&rsquo;t match the format. Tracking IDs look like{" "}
          <span className="font-id">CRV-261101-SEED05</span>: CRV, six digits and six letters or numbers.
        </p>
      </div>
      <TrackingForm defaultValue={id} />
    </div>
  );
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary [&_svg]:size-5" aria-hidden="true">
        {icon}
      </span>
      <div>
        <dt className="text-sm text-muted-foreground">{label}</dt>
        <dd className="font-semibold">{value}</dd>
      </div>
    </div>
  );
}

function Result({ data }: { data: TrackingInfo }) {
  const meta = SHIPMENT_STATUS_META[data.status];
  const terminal = data.status === "DELIVERED" || data.status === "RETURNED" || data.status === "CANCELLED";
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.2fr] lg:items-start">
      <div className="space-y-6 rounded-2xl bg-card p-6 shadow-card sm:p-8">
        <div className="space-y-3">
          <p className="font-id text-sm font-semibold text-muted-foreground">{data.trackingId}</p>
          <h1 className="font-display text-display-2">{meta.label}</h1>
          <p className="text-muted-foreground">{meta.description}</p>
          <StatusBadge kind="shipment" status={data.status} />
        </div>
        <dl className="grid gap-5 border-t border-border pt-6 sm:grid-cols-2">
          <Fact icon={<Package />} label="Route" value={`${data.origin.city} to ${data.destination.city}`} />
          <Fact icon={<Clock3 />} label="Service" value={SERVICE_NAMES[data.serviceType]} />
          <Fact icon={<CalendarDays />} label="Booked" value={formatDate(data.createdAt)} />
          {data.deliveredAt ? (
            <Fact icon={<CircleCheckBig />} label="Delivered" value={formatDateTime(data.deliveredAt)} />
          ) : data.estimatedDeliveryAt ? (
            <Fact icon={<CircleCheckBig />} label="Expected" value={formatDate(data.estimatedDeliveryAt)} />
          ) : null}
        </dl>
        <p className="flex items-start gap-2 rounded-xl bg-surface p-4 text-sm text-muted-foreground">
          <EyeOff className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          Public tracking shows status and cities only. The sender sees full details after logging in.
        </p>
      </div>

      <section aria-labelledby="journey-heading" className="rounded-2xl bg-card p-6 shadow-card sm:p-8">
        <h2 id="journey-heading" className="pb-6 text-xl font-bold tracking-tight">
          Journey
        </h2>
        <Timeline events={fromTrackingTimeline(data.timeline)} showUpcoming={!terminal} />
      </section>
    </div>
  );
}

async function TrackingResult({ params }: { params: Props["params"] }) {
  const raw = decodeURIComponent((await params).trackingId);
  const id = normalizeTrackingId(raw);
  if (!TRACKING_ID_PATTERN.test(id)) return <InvalidId id={raw} />;

  const lookup = await getTracking(id);
  if (lookup.status === "not-found") notFound();
  if (lookup.status === "invalid") return <InvalidId id={raw} />;
  return <Result data={lookup.data} />;
}

export default function TrackingPage({ params }: Props) {
  return (
    <section className="pt-10 pb-20 sm:pt-14 sm:pb-24">
      <Container className="space-y-10">
        <Link
          href="/track"
          className="inline-flex items-center gap-1.5 rounded-md text-sm font-semibold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          Track another parcel <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
        {/* params are request data under Cache Components, so the lookup streams in under Suspense. */}
        <Suspense fallback={<TrackingResultSkeleton />}>
          <TrackingResult params={params} />
        </Suspense>
      </Container>
    </section>
  );
}
