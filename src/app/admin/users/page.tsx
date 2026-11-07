import type { Metadata } from "next";
import { unstable_rethrow } from "next/navigation";
import { Suspense } from "react";
import { UserFilters } from "@/components/admin/user-filters";
import { UserSheet } from "@/components/admin/user-sheet";
import { UsersTable } from "@/components/admin/users-table";
import { LoadError } from "@/components/shared/load-error";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { TableSkeleton, ToolbarSkeleton } from "@/components/shipments/skeletons";
import { ApiError } from "@/lib/api/errors";
import { listAdminUsers } from "@/lib/data/admin";
import { UUID } from "@/lib/ids";
import { firstParam, parseListParams, pickEnum, type RawSearchParams } from "@/lib/list-params";
import { ROLES, USER_STATUSES, type AdminUser, type AdminUserListQuery } from "@/types";

export const metadata: Metadata = { title: "Users", robots: { index: false } };

const SORT_FIELDS = ["name", "email", "createdAt", "role", "status"] as const;

function toQuery(params: RawSearchParams): AdminUserListQuery {
  return {
    ...parseListParams(params, { sortFields: SORT_FIELDS, defaultSort: "createdAt" }),
    role: pickEnum(firstParam(params.role), ROLES),
    status: pickEnum(firstParam(params.status), USER_STATUSES),
  };
}

/**
 * There's no GET /admin/users/:id, so the sheet uses the row from this page. A ?view= user that isn't on
 * this page (e.g. from an audit-log link) costs one extra request: the first 100 accounts.
 */
async function Results({ query, viewId }: { query: AdminUserListQuery; viewId: string | undefined }) {
  let result;
  let viewed: AdminUser | null = null;
  try {
    result = await listAdminUsers(query);
    if (viewId) {
      viewed = result.data.find((u) => u.id === viewId) ?? (await listAdminUsers({ limit: 100, sortBy: "createdAt", sortOrder: "desc" })).data.find((u) => u.id === viewId) ?? null;
    }
  } catch (error) {
    unstable_rethrow(error);
    return <LoadError what="Users" message={ApiError.isApiError(error) ? error.message : undefined} />;
  }
  return (
    <>
      <UsersTable rows={result.data} filtered={Boolean(query.searchTerm || query.role || query.status)} />
      <Pagination meta={result.meta} itemLabel={result.meta.total === 1 ? "user" : "users"} />
      <UserSheet user={viewed} missing={Boolean(viewId && !viewed)} />
    </>
  );
}

async function UserList({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const params = await searchParams;
  const query = toQuery(params);
  const view = firstParam(params.view);
  const viewId = view && UUID.test(view) ? view : undefined;
  // Keyed on the list query only: opening the sheet (?view=) doesn't flash the table skeleton.
  return (
    <Suspense key={JSON.stringify(query)} fallback={<TableSkeleton rows={query.limit ?? 10} />}>
      <Results query={query} viewId={viewId} />
    </Suspense>
  );
}

export default function AdminUsersPage({ searchParams }: PageProps<"/admin/users">) {
  return (
    <>
      <PageHeader title="Users" description="Customers, couriers and admins. Open someone to see their details or change their account status." />
      <div className="space-y-4">
        <Suspense fallback={<ToolbarSkeleton />}>
          <UserFilters />
        </Suspense>
        <Suspense fallback={<TableSkeleton />}>
          <UserList searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}
