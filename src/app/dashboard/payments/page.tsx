import type { Metadata } from "next";
import { unstable_rethrow } from "next/navigation";
import { Suspense } from "react";
import { LoadError } from "@/components/shared/load-error";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { PaymentFilters } from "@/components/payments/payment-filters";
import { PaymentsTable } from "@/components/payments/payments-table";
import { TableSkeleton, ToolbarSkeleton } from "@/components/shipments/skeletons";
import { ApiError } from "@/lib/api/errors";
import { listMyPayments } from "@/lib/data/customer";
import { firstParam, parseListParams, pickEnum, type RawSearchParams } from "@/lib/list-params";
import { PAYMENT_STATUSES, type MyPaymentsQuery, type PaymentSortBy } from "@/types";

export const metadata: Metadata = { title: "Payments", robots: { index: false } };

const SORT_FIELDS: readonly PaymentSortBy[] = ["createdAt", "amount", "paidAt", "status"];

function toQuery(params: RawSearchParams): MyPaymentsQuery {
  const { page, limit, sortBy, sortOrder } = parseListParams(params, { sortFields: SORT_FIELDS, defaultSort: "createdAt" });
  // No searchTerm: /payments/my doesn't support it.
  return { page, limit, sortBy, sortOrder, status: pickEnum(firstParam(params.status), PAYMENT_STATUSES) };
}

async function Results({ query }: { query: MyPaymentsQuery }) {
  let result;
  try {
    result = await listMyPayments(query);
  } catch (error) {
    unstable_rethrow(error);
    return <LoadError what="Your payments" message={ApiError.isApiError(error) ? error.message : undefined} />;
  }
  return (
    <>
      <PaymentsTable rows={result.data} filtered={Boolean(query.status)} />
      <Pagination meta={result.meta} itemLabel={result.meta.total === 1 ? "payment" : "payments"} />
    </>
  );
}

async function PaymentList({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const query = toQuery(await searchParams);
  return (
    <Suspense key={JSON.stringify(query)} fallback={<TableSkeleton rows={query.limit ?? 10} />}>
      <Results query={query} />
    </Suspense>
  );
}

export default function PaymentsPage({ searchParams }: PageProps<"/dashboard/payments">) {
  return (
    <>
      <PageHeader title="Payments" description="Every card payment and refund for your shipments. Amounts are in US dollars." />
      <div className="space-y-4">
        <Suspense fallback={<ToolbarSkeleton />}>
          <PaymentFilters />
        </Suspense>
        <Suspense fallback={<TableSkeleton />}>
          <PaymentList searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}
