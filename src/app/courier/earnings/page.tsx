import { Hourglass, PackageCheck, Wallet, WalletCards } from "lucide-react";
import type { Metadata } from "next";
import { unstable_rethrow } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { EarningFilters } from "@/components/courier/earning-filters";
import { EarningsChart } from "@/components/courier/earnings-chart";
import { EarningsTable } from "@/components/courier/earnings-table";
import { ChartCard } from "@/components/shared/chart-card";
import { LoadError } from "@/components/shared/load-error";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { StatCard, StatCardSkeleton } from "@/components/shared/stat-card";
import { TimeRangeSwitcher } from "@/components/shared/time-range-switcher";
import { TableSkeleton } from "@/components/shipments/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api/errors";
import { earningsSeries } from "@/lib/courier/earnings-series";
import { getMyEarnings } from "@/lib/data/courier";
import { formatCount, formatMoney } from "@/lib/format";
import { firstParam, parseListParams, pickEnum, type RawSearchParams } from "@/lib/list-params";
import { TIME_RANGE_LABELS, isTimeRange, timeRangeToDates, type TimeRange } from "@/lib/time-range";
import { EARNING_STATUSES, type EarningQuery } from "@/types";

export const metadata: Metadata = { title: "Earnings", robots: { index: false } };

/** The chart sums up to this many earnings in the range (one request). */
const CHART_LIMIT = 100;
const SORT_FIELDS = ["createdAt", "amount"] as const;

const rangeOf = (params: RawSearchParams): TimeRange => {
  const raw = firstParam(params.range);
  return isTimeRange(raw) ? raw : "month";
};

/** Stats and chart for the range: one request (summary + up to 100 rows to bucket). */
async function Overview({ range }: { range: TimeRange }) {
  await connection(); // the range resolves against "now"
  const now = new Date();
  const dates = timeRangeToDates(range, now);
  let result;
  try {
    result = await getMyEarnings({ ...dates, limit: CHART_LIMIT, sortBy: "createdAt", sortOrder: "desc" });
  } catch (error) {
    unstable_rethrow(error);
    return <LoadError what="Your earnings" message={ApiError.isApiError(error) ? error.message : undefined} />;
  }
  const { summary } = result;
  const label = TIME_RANGE_LABELS[range];
  const series = earningsSeries(result.earnings, range, dates.fromDate, now);
  const capped = result.meta.total > CHART_LIMIT;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard variant="feature" label="Earned" value={formatMoney(summary.totalEarned)} icon={Wallet} hint={`Total ${label}`} />
        <StatCard label="Awaiting payout" value={formatMoney(summary.pending)} icon={Hourglass} hint="Earned, not paid out yet" />
        <StatCard label="Paid out" value={formatMoney(summary.paidOut)} icon={WalletCards} hint={`Paid to you ${label}`} />
        <StatCard label="Deliveries" value={formatCount(summary.deliveries)} icon={PackageCheck} hint={`Completed ${label}`} />
      </div>
      <ChartCard
        title="Earnings over time"
        description={range === "today" ? "By hour, Dhaka time" : range === "year" ? "By month" : "By day"}
        summary={`You earned ${formatMoney(summary.totalEarned)} ${label} from ${formatCount(summary.deliveries)} deliveries.`}
        footer={capped ? `The chart adds up your latest ${CHART_LIMIT} earnings ${label}; the totals above include all ${formatCount(result.meta.total)}.` : undefined}
      >
        <EarningsChart data={series} />
      </ChartCard>
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
      <Skeleton className="h-80 rounded-xl" />
    </div>
  );
}

async function OverviewForRange({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const range = rangeOf(await searchParams);
  return (
    <Suspense key={range} fallback={<OverviewSkeleton />}>
      <Overview range={range} />
    </Suspense>
  );
}

async function Results({ range, query }: { range: TimeRange; query: Omit<EarningQuery, "fromDate" | "toDate"> }) {
  await connection();
  let result;
  try {
    result = await getMyEarnings({ ...query, ...timeRangeToDates(range, new Date()) });
  } catch (error) {
    unstable_rethrow(error);
    return <LoadError what="Your earnings" message={ApiError.isApiError(error) ? error.message : undefined} />;
  }
  return (
    <>
      <EarningsTable rows={result.earnings} filtered={Boolean(query.status)} rangeLabel={TIME_RANGE_LABELS[range]} />
      <Pagination meta={result.meta} itemLabel={result.meta.total === 1 ? "earning" : "earnings"} />
    </>
  );
}

async function EarningsList({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const params = await searchParams;
  const range = rangeOf(params);
  const { page, limit, sortBy, sortOrder } = parseListParams(params, { sortFields: SORT_FIELDS, defaultSort: "createdAt" });
  const query = { page, limit, sortBy, sortOrder, status: pickEnum(firstParam(params.status), EARNING_STATUSES) };
  return (
    <Suspense key={JSON.stringify({ range, ...query })} fallback={<TableSkeleton rows={limit ?? 10} />}>
      <Results range={range} query={query} />
    </Suspense>
  );
}

export default function EarningsPage({ searchParams }: PageProps<"/courier/earnings">) {
  return (
    <>
      <PageHeader title="Earnings" description="You earn 20% of every shipment you deliver." />
      <div className="space-y-8">
        <Suspense fallback={<Skeleton className="h-11 w-80 max-w-full rounded-full" />}>
          <TimeRangeSwitcher />
        </Suspense>
        <Suspense fallback={<OverviewSkeleton />}>
          <OverviewForRange searchParams={searchParams} />
        </Suspense>
        <section aria-labelledby="earnings-heading" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 id="earnings-heading" className="text-xl font-bold tracking-tight">
              Each delivery
            </h2>
            <Suspense fallback={<Skeleton className="h-11 w-52 rounded-xl" />}>
              <EarningFilters />
            </Suspense>
          </div>
          <Suspense fallback={<TableSkeleton />}>
            <EarningsList searchParams={searchParams} />
          </Suspense>
        </section>
      </div>
    </>
  );
}
