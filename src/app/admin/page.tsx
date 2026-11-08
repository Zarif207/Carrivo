import { AlertTriangle, ArrowRight, Bike, CircleDollarSign, Package, PackageX, RotateCw, ShieldAlert, UserRoundSearch } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { ActivityFeed } from "@/components/admin/activity-feed";
import { BreakdownCard, ShipmentsPerDayCard } from "@/components/admin/overview-charts";
import { Greeting } from "@/components/layout/greeting";
import { LoadError } from "@/components/shared/load-error";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard, StatCardSkeleton } from "@/components/shared/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api/errors";
import { countAdminPayments, getDashboardStats, listAuditLogs } from "@/lib/data/admin";
import { formatCount, formatDateTime, formatMoney, shortDayLabel } from "@/lib/format";
import { PAYMENT_STATUS_META, SHIPMENT_STATUS_META, TONE_CLASSES } from "@/lib/status";
import { cn } from "@/lib/utils";
import { PAYMENT_STATUSES, SHIPMENT_STATUSES } from "@/types";

export const metadata: Metadata = { title: "Operations overview", robots: { index: false } };

/** "2026-11-07" → "Nov 7" (the API's dates are already business-time-zone days). */
const dayLabel = (date: string) => {
  const [, m, d] = date.split("-").map(Number);
  return shortDayLabel(m, d);
};

function Panel({ title, action, children, className }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("space-y-4 rounded-xl bg-card p-6 shadow-card", className)}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function AttentionRow({ href, icon: Icon, label, hint, count }: { href: string; icon: typeof Package; label: string; hint: string; count: number }) {
  return (
    <li>
      <Link href={href} className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50">
        <span className={cn("grid size-9 shrink-0 place-items-center rounded-full", count > 0 ? TONE_CLASSES.amber : "bg-secondary text-muted-foreground")}>
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">{label}</span>
          <span className="block truncate text-xs text-muted-foreground">{hint}</span>
        </span>
        <span className={cn("text-lg font-extrabold tabular", count === 0 && "text-muted-foreground")}>{formatCount(count)}</span>
        <ArrowRight className="size-4 text-muted-foreground" aria-hidden="true" />
      </Link>
    </li>
  );
}

/** Three requests: dashboard-stats (cached 60 s by the API), a review count and the latest audit entries. */
async function Overview() {
  let stats, reviewCount, activity;
  try {
    [stats, reviewCount, activity] = await Promise.all([getDashboardStats(), countAdminPayments({ requiresReview: "true" }), listAuditLogs({ limit: 8 })]);
  } catch (error) {
    unstable_rethrow(error);
    return <LoadError what="The overview" message={ApiError.isApiError(error) ? error.message : undefined} />;
  }
  const { shipments, revenue, paymentsByStatus, counts, failedDeliveryRate } = stats;

  const perDay = stats.shipmentsPerDay.map((d) => ({ label: dayLabel(d.date), value: d.count }));
  const byStatus = SHIPMENT_STATUSES.map((s) => ({ label: SHIPMENT_STATUS_META[s].label, value: shipments.byStatus[s] ?? 0, tone: SHIPMENT_STATUS_META[s].tone }));
  const byPayment = PAYMENT_STATUSES.map((s) => ({ label: PAYMENT_STATUS_META[s].label, value: paymentsByStatus[s] ?? 0, tone: PAYMENT_STATUS_META[s].tone }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard variant="feature" label="Net revenue" value={formatMoney(revenue.net)} icon={CircleDollarSign} hint={`${formatMoney(revenue.grossCollected)} collected, ${formatMoney(revenue.refunded)} refunded`} />
        <StatCard label="Shipments" value={formatCount(shipments.total)} icon={Package} hint={`${formatCount(shipments.byStatus.DELIVERED ?? 0)} delivered`} />
        <StatCard label="Active couriers" value={formatCount(counts.activeCouriers)} icon={Bike} hint={`${formatCount(counts.activeCustomers)} customers, ${formatCount(counts.activeHubs)} hubs`} />
        <StatCard
          label="Failed delivery rate"
          value={`${Math.round(failedDeliveryRate.rate * 1000) / 10}%`}
          icon={PackageX}
          hint={`${formatCount(failedDeliveryRate.failedAttempts)} failed of ${formatCount(failedDeliveryRate.failedAttempts + failedDeliveryRate.deliveredShipments)} attempts`}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_1fr]">
        <ShipmentsPerDayCard points={perDay} />
        <Panel title="Needs attention">
          <ul className="space-y-1">
            <AttentionRow href="/admin/shipments?status=PICKUP_SCHEDULED" icon={UserRoundSearch} label="Waiting for a courier" hint="Paid, pickup scheduled, nobody assigned" count={shipments.byStatus.PICKUP_SCHEDULED ?? 0} />
            <AttentionRow href="/admin/shipments?status=FAILED_DELIVERY" icon={AlertTriangle} label="Failed deliveries" hint="Retry with the courier or return to sender" count={shipments.byStatus.FAILED_DELIVERY ?? 0} />
            <AttentionRow href="/admin/payments?status=REFUND_PENDING" icon={RotateCw} label="Refunds pending" hint="Cancelled after payment, refund not confirmed" count={paymentsByStatus.REFUND_PENDING ?? 0} />
            <AttentionRow href="/admin/payments?requiresReview=true" icon={ShieldAlert} label="Payments to review" hint="Failed refunds, duplicates or amount mismatches" count={reviewCount} />
          </ul>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BreakdownCard title="Shipments by status" description="Every shipment, right now" points={byStatus} seriesName="Shipments" />
        <BreakdownCard title="Payments by status" description="Every checkout, right now" points={byPayment} seriesName="Payments" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Panel
          title="Recent activity"
          action={
            <Link href="/admin/reports" className="inline-flex items-center gap-1 rounded text-sm font-semibold text-brand-text underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50">
              All activity <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          }
        >
          <ActivityFeed logs={activity.data} />
        </Panel>
        <Panel title="Top couriers">
          {stats.topCouriers.length ? (
            <ol className="space-y-3">
              {stats.topCouriers.map((c, i) => (
                <li key={c.id} className="flex items-center gap-3">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-secondary text-xs font-bold tabular">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate font-medium">{c.name}</span>
                  <span className="text-sm text-muted-foreground tabular">{formatCount(c.deliveries)} delivered</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-muted-foreground">No deliveries yet.</p>
          )}
          <p className="text-xs text-muted-foreground">Figures updated {formatDateTime(stats.generatedAt)} (refreshed at most once a minute).</p>
        </Panel>
      </div>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Skeleton className="h-96 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Skeleton className="h-[28rem] rounded-xl" />
        <Skeleton className="h-[28rem] rounded-xl" />
      </div>
    </div>
  );
}

export default function AdminHomePage() {
  return (
    <>
      <PageHeader title={<Greeting fallback="Operations overview" />} description="Shipments, couriers and payments across every zone." />
      <Suspense fallback={<OverviewSkeleton />}>
        <Overview />
      </Suspense>
    </>
  );
}
