"use client";

// Client: filter-by-user links, expandable change details and CSV export of the rows on screen.
import { Download, History } from "lucide-react";
import Link from "next/link";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { useUrlState } from "@/hooks/use-url-state";
import { downloadText, toCsv } from "@/lib/admin/csv";
import { AUDIT_ENTITY_LABELS, auditActionLabel, auditDetail, auditEntityHref, auditSubject } from "@/lib/audit";
import { formatDateTime } from "@/lib/format";
import type { AuditLog } from "@/types";

const linkClass = "rounded underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50";

function Changes({ log }: { log: AuditLog }) {
  if (!log.before && !log.after) return <span className="text-muted-foreground">-</span>;
  return (
    <details className="group max-w-md">
      <summary className="cursor-pointer rounded text-sm font-semibold text-brand-text outline-none focus-visible:ring-3 focus-visible:ring-ring/50">Show</summary>
      <div className="mt-2 grid gap-2 text-xs sm:grid-cols-2">
        {log.before ? (
          <div className="min-w-0">
            <p className="mb-1 font-semibold text-muted-foreground">Before</p>
            <pre className="max-h-48 overflow-auto rounded-md bg-surface p-2 font-id whitespace-pre-wrap break-all">{JSON.stringify(log.before, null, 2)}</pre>
          </div>
        ) : null}
        {log.after ? (
          <div className="min-w-0">
            <p className="mb-1 font-semibold text-muted-foreground">After</p>
            <pre className="max-h-48 overflow-auto rounded-md bg-surface p-2 font-id whitespace-pre-wrap break-all">{JSON.stringify(log.after, null, 2)}</pre>
          </div>
        ) : null}
      </div>
    </details>
  );
}

export function AuditTable({ rows, filtered, page }: { rows: AuditLog[]; filtered: boolean; page: number }) {
  const { hrefWith } = useUrlState();

  const exportCsv = () => {
    const csv = toCsv(
      ["Time (UTC)", "Action", "Change", "Record type", "Record id", "Subject", "By", "By email", "By role", "IP address"],
      rows.map((l) => [l.createdAt, auditActionLabel(l.action), auditDetail(l), AUDIT_ENTITY_LABELS[l.entityType], l.entityId, auditSubject(l), l.actor?.name ?? "System", l.actor?.email, l.actorRole, l.ipAddress]),
    );
    downloadText(`carrivo-audit-page-${page}.csv`, csv);
  };

  const subject = (l: AuditLog) => {
    const href = auditEntityHref(l);
    const text = auditSubject(l);
    return href ? (
      <Link href={href} className={`${linkClass} font-medium`}>
        {text}
      </Link>
    ) : (
      text
    );
  };
  const actor = (l: AuditLog) =>
    l.actor ? (
      <Link href={hrefWith({ actorId: l.actor.id }, true)} className={linkClass} title={`Only show ${l.actor.name}`}>
        {l.actor.name}
      </Link>
    ) : (
      <span className="text-muted-foreground">System</span>
    );

  const columns: DataTableColumn<AuditLog>[] = [
    { id: "time", header: "When", cell: (l) => <span className="text-sm whitespace-nowrap">{formatDateTime(l.createdAt)}</span> },
    {
      id: "action",
      header: "What happened",
      cell: (l) => (
        <div className="max-w-64 min-w-0">
          <p className="font-semibold">{auditActionLabel(l.action)}</p>
          <p className="truncate text-xs text-muted-foreground">
            {subject(l)}
            {auditDetail(l) ? `, ${auditDetail(l)}` : null}
          </p>
        </div>
      ),
    },
    {
      id: "actor",
      header: "By",
      cell: (l) => (
        <div className="min-w-0 text-sm">
          {actor(l)}
          {l.actorRole ? <p className="text-xs text-muted-foreground">{l.actorRole.toLowerCase()}</p> : null}
        </div>
      ),
    },
    { id: "ip", header: "IP", className: "hidden 2xl:table-cell", headerClassName: "hidden 2xl:table-cell", cell: (l) => <span className="font-id text-xs">{l.ipAddress ?? "-"}</span> },
    { id: "changes", header: "Changes", className: "hidden lg:table-cell", headerClassName: "hidden lg:table-cell", cell: (l) => <Changes log={l} /> },
  ];

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={exportCsv} disabled={rows.length === 0}>
          <Download aria-hidden="true" /> Export these {rows.length} rows (CSV)
        </Button>
      </div>
      <DataTable
        caption="Audit log"
        columns={columns}
        data={rows}
        getRowId={(l) => l.id}
        renderMobileCard={(l) => (
          <div className="space-y-1 p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="font-semibold">{auditActionLabel(l.action)}</p>
              <span className="text-xs whitespace-nowrap text-muted-foreground">{formatDateTime(l.createdAt)}</span>
            </div>
            <p className="truncate text-sm text-muted-foreground">
              {subject(l)}
              {auditDetail(l) ? `, ${auditDetail(l)}` : null}
            </p>
            <p className="text-sm">By {actor(l)}</p>
            <Changes log={l} />
          </div>
        )}
        emptyState={
          <EmptyState
            variant="plain"
            icon={History}
            title={filtered ? "Nothing matches these filters" : "No activity yet"}
            description={filtered ? "Try another action, user or dates, or clear the filters." : "Every change made on the platform is recorded here."}
            action={
              filtered ? (
                <Button asChild variant="outline">
                  <Link href="/admin/reports">Clear filters</Link>
                </Button>
              ) : undefined
            }
          />
        }
      />
    </div>
  );
}
