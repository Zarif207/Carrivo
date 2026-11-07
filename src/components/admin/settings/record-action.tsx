"use client";

// Client: deactivate / reactivate / delete for zones, hubs and pricing rules, behind a confirm dialog.
import { CircleAlert, Power, PowerOff, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";

type Kind = "zone" | "hub" | "pricing";
type Action = "deactivate" | "reactivate" | "delete";

const LABEL: Record<Kind, string> = { zone: "zone", hub: "hub", pricing: "pricing rule" };

/*
 * What the API does (checked against the backend, contract §7): DELETE on a zone, hub or pricing rule is a
 * soft delete that removes it from every list (409 lists what still uses a zone or hub). Deactivating
 * is a reversible PATCH isActive.
 */
async function run(kind: Kind, id: string, action: Action) {
  const path = kind === "zone" ? endpoints.zones.detail(id) : kind === "hub" ? endpoints.hubs.detail(id) : endpoints.pricing.detail(id);
  if (action === "delete") return apiFetch(path, { method: "DELETE" });
  return apiFetch(path, { method: "PATCH", body: { isActive: action === "reactivate" } });
}

const COPY: Record<Action, { title: (n: string) => string; body: (k: Kind) => string; confirm: string; done: string }> = {
  deactivate: {
    title: (n) => `Deactivate ${n}?`,
    body: (k) =>
      k === "pricing"
        ? "Quotes stop using this rule; the service's default rule applies instead. You can reactivate it later."
        : `It can't be picked for new shipments. You can reactivate the ${LABEL[k]} later.`,
    confirm: "Deactivate",
    done: "Deactivated",
  },
  reactivate: { title: (n) => `Reactivate ${n}?`, body: () => "It can be used again straight away.", confirm: "Reactivate", done: "Reactivated" },
  delete: {
    title: (n) => `Delete ${n}?`,
    body: (k) =>
      k === "pricing"
        ? "The rule disappears from every list and stops pricing shipments. Shipments already priced keep their price."
        : `The ${LABEL[k]} disappears from every list. The API refuses while anything still uses it.`,
    confirm: "Delete",
    done: "Deleted",
  },
};

export function RecordAction({ kind, id, name, action }: { kind: Kind; id: string; name: string; action: Action }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [problem, setProblem] = useState<string | null>(null);
  const copy = COPY[action];
  const Icon = action === "delete" ? Trash2 : action === "deactivate" ? PowerOff : Power;

  const confirm = async () => {
    setProblem(null);
    try {
      await run(kind, id, action);
      toast.success(`${copy.done}: ${name}`);
      startTransition(() => router.refresh());
    } catch (error) {
      // e.g. 409 "Zone is still in use" + errors: ["1 hub(s) still belong to this zone"], shown as the API words it.
      const message = ApiError.isApiError(error)
        ? [error.message, ...error.errors.map((e) => e.message).filter((m) => m && m !== error.message)].join(". ")
        : "Try again in a moment.";
      setProblem(message);
      toast.error(`Couldn't ${action} the ${LABEL[kind]}`, { description: message });
      throw error; // keep the dialog open
    }
  };

  return (
    <ConfirmDialog
      trigger={
        <Button size="sm" variant="ghost" aria-label={`${copy.confirm} ${name}`} className={action === "reactivate" ? undefined : "text-danger hover:text-danger"}>
          <Icon aria-hidden="true" />
          <span className="hidden xl:inline">{copy.confirm}</span>
        </Button>
      }
      tone={action === "reactivate" ? "default" : "destructive"}
      title={copy.title(name)}
      description={copy.body(kind)}
      confirmLabel={copy.confirm}
      cancelLabel="Keep it"
      onConfirm={confirm}
      onOpenChange={(open) => {
        if (!open) setProblem(null);
      }}
    >
      {problem ? (
        <p role="alert" className="flex items-start gap-2 rounded-lg bg-danger/10 px-3 py-2.5 text-sm font-medium text-danger">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> {problem}
        </p>
      ) : null}
    </ConfirmDialog>
  );
}
