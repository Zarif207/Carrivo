"use client";

// Client: starts Stripe Checkout for one shipment (button state + redirect).
import { CreditCard, Loader2 } from "lucide-react";
import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";
import { usePayShipment } from "@/lib/payments/use-pay-shipment";
import type { Money } from "@/types";

interface PayButtonProps extends Pick<ComponentProps<typeof Button>, "size" | "variant" | "className"> {
  shipmentId: string;
  amount: Money;
  /** Visible label. */
  label?: string;
  /** Append the amount ("Pay $3.25"). */
  showAmount?: boolean;
  /** Names the shipment for screen readers when several Pay buttons share a page. */
  trackingId?: string;
}

export function PayButton({ shipmentId, amount, label = "Pay", showAmount = true, trackingId, size, variant, className }: PayButtonProps) {
  const { pay, pending } = usePayShipment();
  return (
    <Button
      size={size}
      variant={variant}
      className={className}
      disabled={pending}
      aria-busy={pending}
      aria-label={trackingId && !pending ? `${label} ${formatMoney(amount)} for ${trackingId}` : undefined}
      onClick={() => pay(shipmentId)}
    >
      {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <CreditCard aria-hidden="true" />}
      {pending ? "Opening checkout…" : showAmount ? `${label} ${formatMoney(amount)}` : label}
    </Button>
  );
}
