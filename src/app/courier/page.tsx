import { Bike, PackageCheck, Wallet } from "lucide-react";
import type { Metadata } from "next";
import { unstable_rethrow } from "next/navigation";
import { Suspense } from "react";
import { TaskFilters } from "@/components/courier/task-filters";
import { TasksTable } from "@/components/courier/tasks-table";
import { Greeting } from "@/components/layout/greeting";
import { LoadError } from "@/components/shared/load-error";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { StatCard } from "@/components/shared/stat-card";
import { StatsSkeleton, TableSkeleton, ToolbarSkeleton } from "@/components/shipments/skeletons";
import { ApiError } from "@/lib/api/errors";
import { getCourierOverview, listMyTasks } from "@/lib/data/courier";
import { formatCount, formatMoney } from "@/lib/format";
import { firstParam, parseListParams, pickEnum, type RawSearchParams } from "@/lib/list-params";
import { COURIER_TASK_STATUSES, type CourierTaskQuery } from "@/types";

export const metadata: Metadata = { title: "Active tasks", robots: { index: false } };

const SORT_FIELDS = ["createdAt", "updatedAt", "status"] as const;

function toQuery(params: RawSearchParams): CourierTaskQuery {
  return {
    ...parseListParams(params, { sortFields: SORT_FIELDS, defaultSort: "updatedAt" }),
    // No status = the API's "active" view (not DELIVERED / RETURNED / CANCELLED). No date filter exists.
    status: pickEnum(firstParam(params.status), COURIER_TASK_STATUSES),
  };
}

/** Independent of the list filters: two requests (active count, all-time earnings summary). */
async function Stats() {
  let overview;
  try {
    overview = await getCourierOverview();
  } catch (error) {
    unstable_rethrow(error);
    return <LoadError what="Your stats" message={ApiError.isApiError(error) ? error.message : undefined} />;
  }
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <StatCard variant="feature" label="Active tasks" value={formatCount(overview.active)} icon={Bike} hint="Assigned to you, not finished" />
      <StatCard label="Delivered" value={formatCount(overview.delivered)} icon={PackageCheck} hint="All time" />
      <StatCard label="Total earned" value={formatMoney(overview.totalEarned)} icon={Wallet} hint={`${formatMoney(overview.pending)} awaiting payout`} />
    </div>
  );
}

async function Results({ query }: { query: CourierTaskQuery }) {
  let result;
  try {
    result = await listMyTasks(query);
  } catch (error) {
    unstable_rethrow(error);
    return <LoadError what="Your tasks" message={ApiError.isApiError(error) ? error.message : undefined} />;
  }
  return (
    <>
      <TasksTable rows={result.data} filtered={Boolean(query.searchTerm || query.status)} />
      <Pagination meta={result.meta} itemLabel={result.meta.total === 1 ? "task" : "tasks"} />
    </>
  );
}

/** Reads searchParams (request data), then keys the results on the query so every change shows a skeleton. */
async function TaskList({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const query = toQuery(await searchParams);
  return (
    <Suspense key={JSON.stringify(query)} fallback={<TableSkeleton rows={query.limit ?? 10} />}>
      <Results query={query} />
    </Suspense>
  );
}

export default function CourierHomePage({ searchParams }: PageProps<"/courier">) {
  return (
    <>
      <PageHeader title={<Greeting fallback="Active tasks" />} description="Your pickups and deliveries, most recently updated first." />
      <div className="space-y-8">
        <Suspense fallback={<StatsSkeleton />}>
          <Stats />
        </Suspense>
        <section aria-labelledby="tasks-heading" className="space-y-4">
          <h2 id="tasks-heading" className="text-xl font-bold tracking-tight">
            Active tasks
          </h2>
          <Suspense fallback={<ToolbarSkeleton />}>
            <TaskFilters />
          </Suspense>
          <Suspense fallback={<TableSkeleton />}>
            <TaskList searchParams={searchParams} />
          </Suspense>
        </section>
      </div>
    </>
  );
}
