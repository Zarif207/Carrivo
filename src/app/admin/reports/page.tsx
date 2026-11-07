import type { Metadata } from "next";
import { unstable_rethrow } from "next/navigation";
import { Suspense } from "react";
import { AuditFilters } from "@/components/admin/audit-filters";
import { AuditTable } from "@/components/admin/audit-table";
import { LoadError } from "@/components/shared/load-error";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { TableSkeleton, ToolbarSkeleton } from "@/components/shipments/skeletons";
import { ApiError } from "@/lib/api/errors";
import { listAdminUsers, listAuditLogs } from "@/lib/data/admin";
import { UUID } from "@/lib/ids";
import { firstParam, parseListParams, pickDate, pickEnum, type RawSearchParams } from "@/lib/list-params";
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES, type AuditLogQuery } from "@/types";

export const metadata: Metadata = { title: "Reports", robots: { index: false } };

/** Audit logs are newest first; no sortBy or search on the API. */
function toQuery(params: RawSearchParams): AuditLogQuery {
  const { page, limit } = parseListParams(params, { sortFields: ["createdAt"] as const, defaultSort: "createdAt", defaultLimit: 20 });
  const actorId = firstParam(params.actorId);
  return {
    page,
    limit,
    action: pickEnum(firstParam(params.action), AUDIT_ACTIONS),
    entityType: pickEnum(firstParam(params.entityType), AUDIT_ENTITY_TYPES),
    actorId: actorId && UUID.test(actorId) ? actorId : undefined,
    fromDate: pickDate(firstParam(params.fromDate)),
    toDate: pickDate(firstParam(params.toDate)),
  };
}

async function Results({ query }: { query: AuditLogQuery }) {
  let result;
  try {
    result = await listAuditLogs(query);
  } catch (error) {
    unstable_rethrow(error);
    return <LoadError what="The audit log" message={ApiError.isApiError(error) ? error.message : undefined} />;
  }
  return (
    <>
      <AuditTable rows={result.data} page={result.meta.page} filtered={Boolean(query.action || query.entityType || query.actorId || query.fromDate || query.toDate)} />
      <Pagination meta={result.meta} itemLabel={result.meta.total === 1 ? "entry" : "entries"} />
    </>
  );
}

async function AuditList({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const query = toQuery(await searchParams);
  return (
    <Suspense key={JSON.stringify(query)} fallback={<TableSkeleton rows={10} />}>
      <Results query={query} />
    </Suspense>
  );
}

/** People for the user filter: the first 100 accounts by name (one request). */
async function Filters() {
  let users: { id: string; name: string; role: string }[] = [];
  try {
    users = (await listAdminUsers({ limit: 100, sortBy: "name", sortOrder: "asc" })).data.map((u) => ({ id: u.id, name: u.name, role: u.role }));
  } catch (error) {
    unstable_rethrow(error); // the log below reports API trouble; the filter just loses its user list
  }
  return <AuditFilters users={users} />;
}

export default function AdminReportsPage({ searchParams }: PageProps<"/admin/reports">) {
  return (
    <>
      <PageHeader title="Reports" description="The audit log: every change on the platform, who made it and when. Export the rows you're looking at as CSV." />
      <div className="space-y-4">
        <Suspense fallback={<ToolbarSkeleton />}>
          <Filters />
        </Suspense>
        <Suspense fallback={<TableSkeleton />}>
          <AuditList searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}
