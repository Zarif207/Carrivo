import { CircleDollarSign, Hourglass, RotateCcw, ShieldAlert } from "lucide-react";
import type { Metadata } from "next";
import { unstable_rethrow } from "next/navigation";
import { Suspense } from "react";
import { AdminPaymentFilters } from "@/components/admin/payment-filters";
import { AdminPaymentsTable } from "@/components/admin/payments-table";
import { LoadError } from "@/components/shared/load-error";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { StatCard, StatCardSkeleton } from "@/components/shared/stat-card";
import { TableSkeleton, ToolbarSkeleton } from "@/components/shipments/skeletons";
import { ApiError } from "@/lib/api/errors";
import { countAdminPayments, getDashboardStats, listAdminPayments } from "@/lib/data/admin";
import { formatCount, formatMoney } from "@/lib/format";
import { firstParam, parseListParams, pickDate, pickEnum, type RawSearchParams } from "@/lib/list-params";
import { PAYMENT_STATUSES, type AdminPaymentsQuery, type PaymentSortBy } from "@/types";

export const metadata: Metadata = { title: "Payments", robots: { index: false } };

const SORT_FIELDS: readonly PaymentSortBy[] = ["createdAt", "amount", "paidAt", "status"];

function toQuery(params: RawSearchParams): AdminPaymentsQuery {
  const { page, limit, sortBy, sortOrder } = parseListParams(params, { sortFields: SORT_FIELDS, defaultSort: "createdAt" });
  return {
    page,
    limit,
    sortBy,
    sortOrder,
    status: pickEnum(firstParam(params.status), PAYMENT_STATUSES),
    requiresReview: firstParam(params.requiresReview) === "true" ? "true" : undefined,
    fromDate: pickDate(firstParam(params.fromDate)),
    toDate: pickDate(firstParam(params.toDate)),
  };
}

/** Platform totals (dashboard-stats, cached 60 s by the API) plus the review count. */
async function Totals() {
  let stats, review;
  try {
    [stats, review] = await Promise.all([getDashboardStats(), countAdminPayments({ requiresReview: "true" })]);
  } catch (error) {
    unstable_rethrow(error);
    return <LoadError what="Payment totals" message={ApiError.isApiError(error) ? error.message : undefined} />;
  }
  const { revenue, paymentsByStatus } = stats;
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard variant="feature" label="Net revenue" value={formatMoney(revenue.net)} icon={CircleDollarSign} hint={`${formatMoney(revenue.grossCollected)} collected in total`} />
      <StatCard label="Refunded" value={formatMoney(revenue.refunded)} icon={RotateCcw} hint={`${formatCount(paymentsByStatus.REFUNDED ?? 0)} refunds`} />
      <StatCard label="Refunds pending" value={formatCount(paymentsByStatus.REFUND_PENDING ?? 0)} icon={Hourglass} hint="Waiting for Stripe, or to retry" />
      <StatCard label="Needs review" value={formatCount(review)} icon={ShieldAlert} hint="Failed refunds, duplicates, mismatches" />
    </div>
  );
}

async function Results({ query }: { query: AdminPaymentsQuery }) {
  let result;
  try {
    result = await listAdminPayments(query);
  } catch (error) {
    unstable_rethrow(error);
    return <LoadError what="Payments" message={ApiError.isApiError(error) ? error.message : undefined} />;
  }
  return (
    <>
      <AdminPaymentsTable rows={result.data} filtered={Boolean(query.status || query.requiresReview || query.fromDate || query.toDate)} />
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

export default function AdminPaymentsPage({ searchParams }: PageProps<"/admin/payments">) {
  return (
    <>
      <PageHeader title="Payments" description="Every card payment and refund. Amounts in US dollars. Retry refunds that are still pending." />
      <div className="space-y-6">
        <Suspense
          fallback={
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }, (_, i) => (
                <StatCardSkeleton key={i} />
              ))}
            </div>
          }
        >
          <Totals />
        </Suspense>
        <div className="space-y-4">
          <Suspense fallback={<ToolbarSkeleton />}>
            <AdminPaymentFilters />
          </Suspense>
          <Suspense fallback={<TableSkeleton />}>
            <PaymentList searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </>
  );
}
