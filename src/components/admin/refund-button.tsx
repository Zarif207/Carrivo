"use client";

// Client: retries a pending refund (POST /admin/payments/:id/refund) behind a confirm dialog.
import { useQueryClient } from "@tanstack/react-query";
import { RotateCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { CanMutate } from "@/components/auth/role-gate";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { queryKeys } from "@/lib/api/query-keys";
import { formatMoney } from "@/lib/format";
import type { AdminPayment, Money } from "@/types";

interface RefundButtonProps {
  paymentId: string;
  amount: Money;
  trackingId: string;
  size?: "sm" | "default";
}

/** Only for REFUND_PENDING payments (the API answers 409 otherwise). Idempotent on the API side. */
export function RefundButton({ paymentId, amount, trackingId, size = "sm" }: RefundButtonProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [, startTransition] = useTransition();

  const refund = async () => {
    try {
      const { data } = await apiFetch<AdminPayment>(endpoints.admin.refund(paymentId), { method: "POST" });
      if (data.status === "REFUNDED") toast.success("Refund sent", { description: `${formatMoney(data.paidAmount ?? data.amount)} back to the card for ${trackingId}.` });
      else toast.info("Refund requested", { description: "Stripe hasn't confirmed it yet. It updates here when it does." });
      void queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
      startTransition(() => router.refresh());
    } catch (error) {
      toast.error("Refund didn't go through", { description: ApiError.isApiError(error) ? error.message : "Try again in a moment." });
      throw error; // keep the dialog open
    }
  };

  return (
    <CanMutate>
      <ConfirmDialog
        trigger={
          <Button size={size} variant="outline" className="whitespace-nowrap">
            <RotateCw aria-hidden="true" /> Retry refund
          </Button>
        }
        title="Retry this refund?"
        description={`Sends ${formatMoney(amount)} back to the customer's card for ${trackingId}. If Stripe already refunded it, nothing is charged twice.`}
        confirmLabel="Retry refund"
        cancelLabel="Not now"
        onConfirm={refund}
      />
    </CanMutate>
  );
}
