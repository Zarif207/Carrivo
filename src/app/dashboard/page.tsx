import { ArrowRight, CircleDollarSign, PackageCheck, Plus, Truck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Greeting } from "@/components/layout/greeting";
import { LoadError } from "@/components/shared/load-error";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { TimeRangeSwitcher } from "@/components/shared/time-range-switcher";
import { ShipmentsTable } from "@/components/shipments/shipments-table";
import { StatsSkeleton, TableSkeleton } from "@/components/shipments/skeletons";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api/errors";
import { getCustomerOverview } from "@/lib/data/customer";
import { formatCount, formatMoney } from "@/lib/format";
import { firstParam, type RawSearchParams } from "@/lib/list-params";
import { TIME_RANGE_LABELS, isTimeRange, timeRangeBounds, type TimeRange } from "@/lib/time-range";

export const metadata: Metadata = { title: "Overview", robots: { index: false } };

async function Overview({ range }: { range: TimeRange }) {
  // The range is resolved against "now": request time only (CLAUDE.md, Cache Components).
  await connection();
  let overview;
  try {
    overview = await getCustomerOverview(timeRangeBounds(range, new Date()));
  } catch (error) {
    unstable_rethrow(error);
    return <LoadError what="Your overview" message={ApiError.isApiError(error) ? error.message : undefined} />;
  }
  const label = TIME_RANGE_LABELS[range];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard variant="feature" label="Active shipments" value={formatCount(overview.active)} icon={Truck} hint={`Booked ${label}, not yet delivered`} />
        <StatCard label="Delivered" value={formatCount(overview.delivered)} icon={PackageCheck} hint={`Of ${formatCount(overview.total)} booked ${label}`} />
        <StatCard
          label="Total spend"
          value={formatMoney(overview.spend)}
          icon={CircleDollarSign}
          hint={overview.paidCount === 1 ? `1 payment ${label}` : `${formatCount(overview.paidCount)} payments ${label}`}
        />
      </div>

      <section aria-labelledby="recent-heading" className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <h2 id="recent-heading" className="text-xl font-bold tracking-tight">
            Recent shipments
          </h2>
          {overview.total > 0 ? (
            <Link href="/dashboard/shipments" className="inline-flex items-center gap-1 rounded text-sm font-semibold text-brand-text underline-offset-4 hover:underline">
              View all <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          ) : null}
        </div>
        <ShipmentsTable rows={overview.recent} filtered={false} sortable={false} caption={`Shipments booked ${label}`} />
      </section>
    </div>
  );
}

/** Reads ?range= (request data) and keys the stats on it, so switching shows a skeleton. */
async function OverviewForRange({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const raw = firstParam((await searchParams).range);
  const range: TimeRange = isTimeRange(raw) ? raw : "month";
  return (
    <Suspense key={range} fallback={<OverviewSkeleton />}>
      <Overview range={range} />
    </Suspense>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-8">
      <StatsSkeleton />
      <div className="space-y-4">
        <Skeleton className="h-7 w-48" />
        <TableSkeleton rows={5} />
      </div>
    </div>
  );
}

export default function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  return (
    <>
      <PageHeader
        title={<Greeting fallback="Your shipments" />}
        description="Here's how your parcels are doing."
        actions={
          <Button asChild>
            <Link href="/dashboard/shipments/new">
              <Plus aria-hidden="true" /> New shipment
            </Link>
          </Button>
        }
      />
      <div className="mb-6">
        <Suspense fallback={<Skeleton className="h-11 w-80 max-w-full rounded-full" />}>
          <TimeRangeSwitcher />
        </Suspense>
      </div>
      <Suspense fallback={<OverviewSkeleton />}>
        <OverviewForRange searchParams={searchParams} />
      </Suspense>
    </>
  );
}
