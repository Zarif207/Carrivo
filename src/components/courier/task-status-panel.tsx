"use client";

// Client: the courier's next-status buttons, a confirm dialog with a note, and an optimistic status change.
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { queryKeys } from "@/lib/api/query-keys";
import { COURIER_ACTIONS, courierHint, courierNextActions, type CourierTarget } from "@/lib/courier/actions";
import type { ShipmentDetail, ShipmentPaymentStatus, ShipmentStatus } from "@/types";

interface TaskStatusPanelProps {
  task: Pick<ShipmentDetail, "id" | "trackingId" | "status" | "failedAttempts"> & { paymentStatus: ShipmentPaymentStatus; hasProof: boolean };
}

function errorMessage(error: unknown): string {
  if (!ApiError.isApiError(error)) return "Couldn't update the status. Try again.";
  if (error.isNetworkError) return "You're offline or the server didn't answer. Nothing changed; try again.";
  if (error.isNotFound) return "This task is no longer assigned to you.";
  return error.message; // 400 lists the allowed moves; 409 says what changed
}

export function TaskStatusPanel({ task }: TaskStatusPanelProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<ShipmentStatus>(task.status);
  const [attempts, setAttempts] = useState(task.failedAttempts);
  const [target, setTarget] = useState<CourierTarget | null>(null);
  const [note, setNote] = useState("");
  const [, startTransition] = useTransition();

  // A fresh server render (router.refresh) brings new props: follow them.
  const [seen, setSeen] = useState(task);
  if (seen.status !== task.status || seen.failedAttempts !== task.failedAttempts) {
    setSeen(task);
    setStatus(task.status);
    setAttempts(task.failedAttempts);
  }

  const actions = courierNextActions(status, attempts);
  const action = target ? COURIER_ACTIONS[target] : null;
  const trimmed = note.trim();
  const noteValid = action?.noteRequired ? trimmed.length >= 3 && trimmed.length <= 500 : trimmed === "" || (trimmed.length >= 3 && trimmed.length <= 500);

  const open = (next: CourierTarget) => {
    setNote("");
    setTarget(next);
  };

  const confirm = async () => {
    if (!target || !action) return;
    const previous = { status, attempts };
    setStatus(target); // optimistic
    if (target === "FAILED_DELIVERY") setAttempts((n) => n + 1);
    try {
      await apiFetch<ShipmentDetail>(endpoints.shipments.status(task.id), {
        method: "PATCH",
        body: trimmed ? { status: target, note: trimmed } : { status: target },
      });
      toast.success(action.done, { description: task.trackingId });
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      startTransition(() => router.refresh());
    } catch (error) {
      setStatus(previous.status); // rollback
      setAttempts(previous.attempts);
      toast.error(errorMessage(error));
      throw error; // keeps the dialog open with the note intact
    }
  };

  const deliveredWithoutProof = target === "DELIVERED" && !task.hasProof;

  return (
    <div className="flex flex-col gap-5 rounded-xl bg-card p-6 shadow-card md:flex-row md:items-center md:justify-between">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge kind="shipment" status={status} />
          <StatusBadge kind="shipment-payment" status={task.paymentStatus} />
        </div>
        <p className="text-muted-foreground" aria-live="polite">
          {courierHint(status, attempts)}
        </p>
      </div>

      {actions.length ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {actions.map((key) => {
            const a = COURIER_ACTIONS[key];
            const Icon = a.icon;
            return (
              <Button key={key} size="lg" variant={a.tone === "destructive" ? "outline" : "default"} onClick={() => open(key)} className="w-full sm:w-auto">
                <Icon aria-hidden="true" /> {a.label}
              </Button>
            );
          })}
        </div>
      ) : null}

      {/* One dialog, always mounted: the optimistic status hides the buttons, never the open dialog. */}
      {action ? (
        <ConfirmDialog
          open={target !== null}
          onOpenChange={(next) => {
            if (!next) setTarget(null);
          }}
          title={action.title}
          description={
            deliveredWithoutProof ? `${action.description} You haven't added a proof photo yet; you can still add one afterwards.` : action.description
          }
          confirmLabel={action.confirmLabel}
          cancelLabel="Go back"
          tone={action.tone}
          confirmDisabled={!noteValid}
          onConfirm={confirm}
        >
          <div className="space-y-2">
            <Label htmlFor="status-note">
              {action.noteLabel} {action.noteRequired ? null : <span className="font-normal text-muted-foreground">(optional)</span>}
            </Label>
            <Textarea
              id="status-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              rows={3}
              required={action.noteRequired}
              placeholder={action.noteRequired ? "e.g. Receiver not home, phone off" : undefined}
              aria-invalid={(trimmed !== "" && !noteValid) || undefined}
              aria-describedby="status-note-hint"
            />
            <p id="status-note-hint" className={trimmed !== "" && !noteValid ? "text-xs font-medium text-danger" : "text-xs text-muted-foreground"}>
              {action.noteRequired ? "Required. 3 to 500 characters, saved on the shipment's history." : "3 to 500 characters if you add one."}
            </p>
          </div>
        </ConfirmDialog>
      ) : null}
    </div>
  );
}
