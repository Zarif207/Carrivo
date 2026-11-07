import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { DASHBOARD_NAV, ROLE_HOME } from "@/config/nav";
import type { Role } from "@/types";

/*
 * TEMPORARY: placeholder for nav destinations that later phases build. Each area has one
 * catch-all route ([...section]) that renders this; a real page at the same path takes
 * precedence automatically, so these disappear as the phases land. Paths that aren't in the
 * role's navigation get a real 404.
 */

function UpcomingSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-28 rounded-xl" />
    </div>
  );
}

async function UpcomingContent({ role, params }: { role: Role; params: Promise<{ section: string[] }> }) {
  const { section } = await params;
  const href = `${ROLE_HOME[role]}/${section.join("/")}`;
  const item = DASHBOARD_NAV[role].find((entry) => entry.href === href);
  if (!item) notFound();

  return (
    <>
      <PageHeader title={item.title} back={{ href: ROLE_HOME[role], label: "Back to overview" }} />
      <div className="flex items-start gap-4 rounded-xl bg-card p-6 shadow-card">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-secondary">
          <item.icon className="size-6" aria-hidden="true" />
        </span>
        <div className="space-y-1">
          <h2 className="text-lg font-bold">Coming in the next build step</h2>
          <p className="text-muted-foreground">This page isn&rsquo;t built yet. Everything you see here will come from your live account data.</p>
        </div>
      </div>
    </>
  );
}

/** params are request data under Cache Components, so they're read under <Suspense>. */
export function UpcomingPage({ role, params }: { role: Role; params: Promise<{ section: string[] }> }) {
  return (
    <Suspense fallback={<UpcomingSkeleton />}>
      <UpcomingContent role={role} params={params} />
    </Suspense>
  );
}
