import type { Metadata } from "next";
import { redirect, unstable_rethrow } from "next/navigation";
import { Suspense } from "react";
import { AdminShipmentFilters } from "@/components/admin/shipment-filters";
import { AdminShipmentsTable } from "@/components/admin/shipments-table";
import { LoadError } from "@/components/shared/load-error";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { TableSkeleton, ToolbarSkeleton } from "@/components/shipments/skeletons";
import { ApiError } from "@/lib/api/errors";
import { listAdminShipments, listCouriers } from "@/lib/data/admin";
import { UUID } from "@/lib/ids";
import { firstParam, parseListParams, pickDate, pickEnum, type RawSearchParams } from "@/lib/list-params";
import { SHIPMENT_STATUSES, type ShipmentListQuery, type ShipmentSortBy } from "@/types";

export const metadata: Metadata = { title: "Shipments", robots: { index: false } };

const SORT_FIELDS: readonly ShipmentSortBy[] = ["createdAt", "updatedAt", "price", "weightKg", "status", "trackingId"];

function toQuery(params: RawSearchParams): ShipmentListQuery {
  const courierId = firstParam(params.courierId);
  return {
    ...parseListParams(params, { sortFields: SORT_FIELDS, defaultSort: "createdAt" }),
    status: pickEnum(firstParam(params.status), SHIPMENT_STATUSES),
    courierId: courierId && UUID.test(courierId) ? courierId : undefined,
    fromDate: pickDate(firstParam(params.fromDate)),
    toDate: pickDate(firstParam(params.toDate)),
  };
}

async function Results({ query }: { query: ShipmentListQuery }) {
  let result;
  try {
    result = await listAdminShipments(query);
  } catch (error) {
    unstable_rethrow(error);
    return <LoadError what="Shipments" message={ApiError.isApiError(error) ? error.message : undefined} />;
  }
  const filtered = Boolean(query.searchTerm || query.status || query.courierId || query.fromDate || query.toDate);
  return (
    <>
      <AdminShipmentsTable rows={result.data} filtered={filtered} />
      <Pagination meta={result.meta} itemLabel={result.meta.total === 1 ? "shipment" : "shipments"} />
    </>
  );
}

async function ShipmentList({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const params = await searchParams;
  // Old email-link form (/admin/shipments?view=<id>) now has its own page.
  const view = firstParam(params.view);
  if (view && UUID.test(view)) redirect(`/admin/shipments/${view}`);
  const query = toQuery(params);
  return (
    <Suspense key={JSON.stringify(query)} fallback={<TableSkeleton rows={query.limit ?? 10} />}>
      <Results query={query} />
    </Suspense>
  );
}

/** Couriers for the filter (one request; the API caps a page at 100). */
async function Filters() {
  let couriers: { id: string; name: string }[] = [];
  try {
    couriers = (await listCouriers({ limit: 100, sortBy: "name", sortOrder: "asc" })).data.map((c) => ({ id: c.id, name: c.name }));
  } catch (error) {
    unstable_rethrow(error); // the list below reports API trouble; the filter just loses its courier options
  }
  return <AdminShipmentFilters couriers={couriers} />;
}

export default function AdminShipmentsPage({ searchParams }: PageProps<"/admin/shipments">) {
  return (
    <>
      <PageHeader title="Shipments" description="Every shipment on the platform. Search, filter by status, courier or booking date." />
      <div className="space-y-4">
        <Suspense fallback={<ToolbarSkeleton />}>
          <Filters />
        </Suspense>
        <Suspense fallback={<TableSkeleton />}>
          <ShipmentList searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}
