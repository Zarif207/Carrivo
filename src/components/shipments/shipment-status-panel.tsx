"use client";

// Client: cancel with an optimistic status change (rolled back if the API refuses) and the pay button.
import { Ban, CreditCard } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { queryKeys } from "@/lib/api/query-keys";
import { formatMoney } from "@/lib/format";
import { SHIPMENT_STATUS_META } from "@/lib/status";
import { CANCELLABLE_STATUSES, type ShipmentDetail, type ShipmentPaymentStatus, type ShipmentStatus } from "@/types";

interface ShipmentStatusPanelProps {
  shipment: Pick<ShipmentDetail, "id" | "trackingId" | "status" | "paymentStatus" | "price">;
}

export function ShipmentStatusPanel({ shipment }: ShipmentStatusPanelProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<ShipmentStatus>(shipment.status);
  const [paymentStatus, setPaymentStatus] = useState<ShipmentPaymentStatus>(shipment.paymentStatus);
  const [reason, setReason] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [, startTransition] = useTransition();

  // A fresh server render (router.refresh) brings new props: follow them.
  const [seen, setSeen] = useState(shipment);
  if (seen.status !== shipment.status || seen.paymentStatus !== shipment.paymentStatus) {
    setSeen(shipment);
    setStatus(shipment.status);
    setPaymentStatus(shipment.paymentStatus);
  }

  const cancellable = (CANCELLABLE_STATUSES as readonly ShipmentStatus[]).includes(status);
  const payable = paymentStatus === "UNPAID" && status !== "CANCELLED";
  const reasonValid = reason.trim() === "" || (reason.trim().length >= 3 && reason.trim().length <= 500);

  const cancel = async () => {
    const previous = status;
    setStatus("CANCELLED"); // optimistic
    try {
      await apiFetch<ShipmentDetail>(endpoints.shipments.cancel(shipment.id), {
        method: "POST",
        body: reason.trim() ? { reason: reason.trim() } : {},
      });
      toast.success("Shipment cancelled", {
        description: paymentStatus === "PAID" ? "Your refund has been requested. It goes back to the card you paid with." : undefined,
      });
      setReason("");
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all }); // refund notifications
      startTransition(() => router.refresh());
    } catch (error) {
      setStatus(previous); // rollback
      toast.error(ApiError.isApiError(error) ? error.message : "Couldn't cancel the shipment. Try again.");
      throw error; // keeps the dialog open
    }
  };

  return (
    <div className="flex flex-col gap-5 rounded-xl bg-card p-6 shadow-card sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge kind="shipment" status={status} />
          <StatusBadge kind="shipment-payment" status={paymentStatus} />
        </div>
        <p className="text-muted-foreground">{SHIPMENT_STATUS_META[status].description}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {payable ? (
          <Tooltip>
            <TooltipTrigger asChild>
              {/* span keeps the tooltip reachable while the button is disabled */}
              <span tabIndex={0} className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                <Button disabled aria-describedby="pay-note">
                  <CreditCard aria-hidden="true" /> Pay {formatMoney(shipment.price)}
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent id="pay-note">Card payment is being connected and arrives in the next update.</TooltipContent>
          </Tooltip>
        ) : null}
        {/* Stays mounted while open: the optimistic CANCELLED must not unmount it mid-request. */}
        {cancellable || confirmOpen ? (
          <ConfirmDialog
            open={confirmOpen}
            onOpenChange={setConfirmOpen}
            trigger={
              <Button variant="outline">
                <Ban aria-hidden="true" /> Cancel shipment
              </Button>
            }
            tone="destructive"
            title="Cancel this shipment?"
            description={
              paymentStatus === "PAID"
                ? `${shipment.trackingId} hasn't been picked up yet. The full ${formatMoney(shipment.price)} goes back to your card.`
                : `${shipment.trackingId} hasn't been picked up yet. You haven't paid for it, so nothing is charged.`
            }
            confirmLabel="Cancel shipment"
            cancelLabel="Keep shipment"
            confirmDisabled={!reasonValid}
            onConfirm={cancel}
          >
            <div className="space-y-2">
              <Label htmlFor="cancel-reason">
                Reason <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="cancel-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={500}
                rows={3}
                aria-invalid={!reasonValid || undefined}
                aria-describedby="cancel-reason-hint"
              />
              <p id="cancel-reason-hint" className={reasonValid ? "text-xs text-muted-foreground" : "text-xs font-medium text-danger"}>
                {reasonValid ? "Helps us improve. 3 to 500 characters." : "Write at least 3 characters, or leave it empty."}
              </p>
            </div>
          </ConfirmDialog>
        ) : null}
      </div>
    </div>
  );
}
