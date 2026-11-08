import { unstable_rethrow } from "next/navigation";
import { Suspense } from "react";
import { LoadError } from "@/components/shared/load-error";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api/errors";
import { listMyNotifications } from "@/lib/data/notifications";
import { firstParam, parseListParams, type RawSearchParams } from "@/lib/list-params";
import type { NotificationQuery } from "@/types";
import { NotificationFilter } from "./notification-filter";
import { NotificationsList } from "./notifications-list";

/** What differs between the customer and courier notification pages (plain data only). */
export interface NotificationsPageConfig {
  description: string;
  listHref: string;
  shipmentBase: string;
  emptyAction: { label: string; href: string };
  emptyDescription: string;
}

function ListSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="flex justify-end">
        <Skeleton className="h-10 w-44 rounded-full" />
      </div>
      <div className="divide-y divide-border rounded-xl bg-card shadow-card">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex gap-4 p-5">
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

async function Results({ query, config }: { query: NotificationQuery; config: NotificationsPageConfig }) {
  let result;
  try {
    result = await listMyNotifications(query);
  } catch (error) {
    unstable_rethrow(error);
    return <LoadError what="Your notifications" message={ApiError.isApiError(error) ? error.message : undefined} />;
  }
  return (
    <>
      <NotificationsList
        items={result.data}
        unreadOnly={query.unread === "true"}
        listHref={config.listHref}
        shipmentBase={config.shipmentBase}
        emptyAction={config.emptyAction}
        emptyDescription={config.emptyDescription}
      />
      <Pagination meta={result.meta} itemLabel="notifications" />
    </>
  );
}

/** Reads searchParams (request data), then keys the results on the query so every change shows a skeleton. */
async function NotificationResults({ searchParams, config }: { searchParams: Promise<RawSearchParams>; config: NotificationsPageConfig }) {
  const params = await searchParams;
  const { page, limit, sortOrder } = parseListParams(params, { sortFields: ["createdAt"] as const, defaultSort: "createdAt", defaultLimit: 15 });
  const query: NotificationQuery = { page, limit, sortOrder, ...(firstParam(params.unread) === "true" ? { unread: "true" } : {}) };
  return (
    <Suspense key={JSON.stringify(query)} fallback={<ListSkeleton />}>
      <Results query={query} config={config} />
    </Suspense>
  );
}

/** The full notifications page (All / Unread, pagination, mark read). Same for every role that has one. */
export function NotificationsPage({ searchParams, config }: { searchParams: Promise<RawSearchParams>; config: NotificationsPageConfig }) {
  return (
    <>
      <PageHeader title="Notifications" description={config.description} />
      <div className="space-y-4">
        <Suspense fallback={<Skeleton className="h-11 w-44 rounded-full" />}>
          <NotificationFilter />
        </Suspense>
        <Suspense fallback={<ListSkeleton />}>
          <NotificationResults searchParams={searchParams} config={config} />
        </Suspense>
      </div>
    </>
  );
}
