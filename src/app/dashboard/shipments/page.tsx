import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { LoadError } from "@/components/shared/load-error";
import { Pagination } from "@/components/shared/pagination";
import { ShipmentFilters } from "@/components/shipments/shipment-filters";
import { ShipmentsTable } from "@/components/shipments/shipments-table";
import { TableSkeleton, ToolbarSkeleton } from "@/components/shipments/skeletons";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/errors";
import { listMyShipments } from "@/lib/data/customer";
import { firstParam, parseListParams, pickEnum, type RawSearchParams } from "@/lib/list-params";
import { SHIPMENT_PAYMENT_STATUSES, SHIPMENT_STATUSES, type ShipmentListQuery, type ShipmentSortBy } from "@/types";

export const metadata: Metadata = { title: "Shipments", robots: { index: false } };

const SORT_FIELDS: readonly ShipmentSortBy[] = ["createdAt", "updatedAt", "price", "weightKg", "status", "trackingId"];

function toQuery(params: RawSearchParams): ShipmentListQuery {
  return {
    ...parseListParams(params, { sortFields: SORT_FIELDS, defaultSort: "createdAt" }),
    status: pickEnum(firstParam(params.status), SHIPMENT_STATUSES),
    paymentStatus: pickEnum(firstParam(params.paymentStatus), SHIPMENT_PAYMENT_STATUSES),
  };
}

async function Results({ query }: { query: ShipmentListQuery }) {
  let result;
  try {
    result = await listMyShipments(query);
  } catch (error) {
    unstable_rethrow(error); // let redirect()/notFound() through
    return <LoadError what="Your shipments" message={ApiError.isApiError(error) ? error.message : undefined} />;
  }
  const filtered = Boolean(query.searchTerm || query.status || query.paymentStatus);
  return (
    <>
      <ShipmentsTable rows={result.data} filtered={filtered} />
      <Pagination meta={result.meta} itemLabel={result.meta.total === 1 ? "shipment" : "shipments"} />
    </>
  );
}

/** Reads searchParams (request data), then keys the results boundary on the query so every change shows a skeleton. */
async function ShipmentList({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const query = toQuery(await searchParams);
  return (
    <Suspense key={JSON.stringify(query)} fallback={<TableSkeleton rows={query.limit ?? 10} />}>
      <Results query={query} />
    </Suspense>
  );
}

export default function ShipmentsPage({ searchParams }: PageProps<"/dashboard/shipments">) {
  return (
    <>
      <PageHeader
        title="Shipments"
        description="Every parcel you've booked, newest first. Search by tracking ID, receiver name or phone."
        actions={
          <Button asChild>
            <Link href="/dashboard/shipments/new">
              <Plus aria-hidden="true" /> New shipment
            </Link>
          </Button>
        }
      />
      <div className="space-y-4">
        <Suspense fallback={<ToolbarSkeleton />}>
          <ShipmentFilters />
        </Suspense>
        <Suspense fallback={<TableSkeleton />}>
          <ShipmentList searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}
