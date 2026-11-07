import type { Metadata } from "next";
import { unstable_rethrow } from "next/navigation";
import { Suspense } from "react";
import { NotificationFilter } from "@/components/notifications/notification-filter";
import { NotificationsList } from "@/components/notifications/notifications-list";
import { LoadError } from "@/components/shared/load-error";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api/errors";
import { listMyNotifications } from "@/lib/data/customer";
import { firstParam, parseListParams, type RawSearchParams } from "@/lib/list-params";
import type { NotificationQuery } from "@/types";

export const metadata: Metadata = { title: "Notifications", robots: { index: false } };

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

async function Results({ query }: { query: NotificationQuery }) {
  let result;
  try {
    result = await listMyNotifications(query);
  } catch (error) {
    unstable_rethrow(error);
    return <LoadError what="Your notifications" message={ApiError.isApiError(error) ? error.message : undefined} />;
  }
  return (
    <>
      <NotificationsList items={result.data} unreadOnly={query.unread === "true"} />
      <Pagination meta={result.meta} itemLabel="notifications" />
    </>
  );
}

async function NotificationResults({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const params = await searchParams;
  const { page, limit, sortOrder } = parseListParams(params, { sortFields: ["createdAt"] as const, defaultSort: "createdAt", defaultLimit: 15 });
  const query: NotificationQuery = { page, limit, sortOrder, ...(firstParam(params.unread) === "true" ? { unread: "true" } : {}) };
  return (
    <Suspense key={JSON.stringify(query)} fallback={<ListSkeleton />}>
      <Results query={query} />
    </Suspense>
  );
}

export default function NotificationsPage({ searchParams }: PageProps<"/dashboard/notifications">) {
  return (
    <>
      <PageHeader title="Notifications" description="Updates about your bookings, payments and deliveries." />
      <div className="space-y-4">
        <Suspense fallback={<Skeleton className="h-11 w-44 rounded-full" />}>
          <NotificationFilter />
        </Suspense>
        <Suspense fallback={<ListSkeleton />}>
          <NotificationResults searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}
