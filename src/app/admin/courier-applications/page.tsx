import type { Metadata } from "next";
import { unstable_rethrow } from "next/navigation";
import { Suspense } from "react";
import { ApplicationFilters } from "@/components/admin/courier-applications/application-filters";
import { ApplicationSheet } from "@/components/admin/courier-applications/application-sheet";
import { ApplicationTabs } from "@/components/admin/courier-applications/application-tabs";
import { ApplicationsTable } from "@/components/admin/courier-applications/applications-table";
import { LoadError } from "@/components/shared/load-error";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { TableSkeleton, ToolbarSkeleton } from "@/components/shipments/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { APPLICATION_TABS, parseApplicationTab, statusForTab, type ApplicationTab } from "@/lib/admin/courier-application-tabs";
import { ApiError } from "@/lib/api/errors";
import { countCourierApplications, getCourierApplication, listCourierApplications } from "@/lib/data/admin";
import { getPublicHubs, getPublicZones } from "@/lib/data/public";
import { UUID } from "@/lib/ids";
import { firstParam, parseListParams, type RawSearchParams } from "@/lib/list-params";
import type { AdminCourierApplication, CourierApplicationListQuery } from "@/types";

export const metadata: Metadata = { title: "Courier applications", robots: { index: false } };

const SORT_FIELDS = ["createdAt", "updatedAt", "status"] as const;

function toQuery(params: RawSearchParams): { tab: ApplicationTab; query: CourierApplicationListQuery } {
  const tab = parseApplicationTab(firstParam(params.status));
  const zone = firstParam(params.zoneId);
  return {
    tab,
    query: {
      ...parseListParams(params, { sortFields: SORT_FIELDS, defaultSort: "createdAt" }),
      status: statusForTab(tab),
      zoneId: zone && UUID.test(zone) ? zone : undefined,
    },
  };
}

/** Tabs, table, pagination and sheet: one list call, four counts (limit=1 each), zones and hubs (cached). */
async function Results({ tab, query, viewId }: { tab: ApplicationTab; query: CourierApplicationListQuery; viewId: string | undefined }) {
  const filters = { searchTerm: query.searchTerm, zoneId: query.zoneId };
  let result, counts: Record<ApplicationTab, number>, viewed: AdminCourierApplication | null = null;
  let zones: Awaited<ReturnType<typeof getPublicZones>> = [];
  let hubs: Awaited<ReturnType<typeof getPublicHubs>> = [];
  try {
    let totals: number[];
    [totals, result, zones, hubs] = await Promise.all([
      Promise.all(APPLICATION_TABS.map((t) => countCourierApplications({ ...filters, status: statusForTab(t) }))),
      listCourierApplications(query),
      getPublicZones().catch(() => []),
      getPublicHubs().catch(() => []),
    ]);
    counts = Object.fromEntries(APPLICATION_TABS.map((t, i) => [t, totals[i]])) as Record<ApplicationTab, number>;
    if (viewId) {
      viewed = result.data.find((a) => a.id === viewId) ?? (await getCourierApplication(viewId).catch((error: unknown) => {
        if (ApiError.isApiError(error) && error.isNotFound) return null;
        throw error;
      }));
    }
  } catch (error) {
    unstable_rethrow(error);
    return <LoadError what="Courier applications" message={ApiError.isApiError(error) ? error.message : undefined} />;
  }
  const zoneList = zones.map(({ id, name }) => ({ id, name }));
  return (
    <div className="space-y-4">
      <ApplicationTabs tab={tab} counts={counts} />
      <ApplicationsTable rows={result.data} tab={tab} filtered={Boolean(query.searchTerm || query.zoneId)} />
      <Pagination meta={result.meta} itemLabel={result.meta.total === 1 ? "application" : "applications"} />
      <ApplicationSheet application={viewed} missing={Boolean(viewId && !viewed)} zones={zoneList} hubs={hubs} />
    </div>
  );
}

function ResultsSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      <Skeleton className="h-11 w-full max-w-md rounded-full" />
      <TableSkeleton rows={rows} />
    </div>
  );
}

async function ApplicationList({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const params = await searchParams;
  const { tab, query } = toQuery(params);
  const view = firstParam(params.view);
  const viewId = view && UUID.test(view) ? view : undefined;
  // Keyed on the list query only: opening the sheet (?view=) doesn't flash the table skeleton.
  return (
    <Suspense key={JSON.stringify(query)} fallback={<ResultsSkeleton rows={query.limit ?? 10} />}>
      <Results tab={tab} query={query} viewId={viewId} />
    </Suspense>
  );
}

async function Filters() {
  const zones = await getPublicZones().catch(() => []);
  return <ApplicationFilters zones={zones.map(({ id, name }) => ({ id, name }))} />;
}

export default function AdminCourierApplicationsPage({ searchParams }: PageProps<"/admin/courier-applications">) {
  return (
    <>
      <PageHeader title="Courier applications" description="Customers who want to deliver for Carrivo. Open one to read it, then approve or reject it." />
      <div className="space-y-4">
        <Suspense fallback={<ToolbarSkeleton />}>
          <Filters />
        </Suspense>
        <Suspense fallback={<ResultsSkeleton />}>
          <ApplicationList searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}
