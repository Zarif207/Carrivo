import { History } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/shared/empty-state";
import { RelativeTime } from "@/components/shared/relative-time";
import { auditActionLabel, auditDetail, auditEntityHref, auditSubject } from "@/lib/audit";
import type { AuditLog } from "@/types";

/** Server-safe list of recent audit entries: who did what to which record, and when. */
export function ActivityFeed({ logs }: { logs: AuditLog[] }) {
  if (logs.length === 0) return <EmptyState variant="plain" icon={History} title="No activity yet" description="Changes made by staff, couriers and customers show up here." />;
  return (
    <ol className="divide-y divide-border">
      {logs.map((log) => {
        const href = auditEntityHref(log);
        const subject = auditSubject(log);
        const detail = auditDetail(log);
        return (
          <li key={log.id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
            <div className="min-w-0 space-y-0.5">
              <p className="font-semibold">
                {auditActionLabel(log.action)}
                {detail ? <span className="font-normal text-muted-foreground">: {detail}</span> : null}
              </p>
              <p className="truncate text-sm text-muted-foreground">
                {href ? (
                  <Link href={href} className="rounded font-medium text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50">
                    {subject}
                  </Link>
                ) : (
                  subject
                )}
                {" by "}
                {log.actor ? log.actor.name : "the system"}
              </p>
            </div>
            <RelativeTime value={log.createdAt} className="shrink-0 text-xs whitespace-nowrap text-muted-foreground" />
          </li>
        );
      })}
    </ol>
  );
}
