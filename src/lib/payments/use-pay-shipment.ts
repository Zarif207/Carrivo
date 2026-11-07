"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { queryKeys } from "@/lib/api/query-keys";
import type { CheckoutSession } from "@/types";

/** Only ever send the browser to Stripe's own Checkout host. */
function isStripeCheckout(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.hostname === "checkout.stripe.com";
  } catch {
    return false;
  }
}

/** A clear message for every failure POST /payments/initiate can return (contract §5). */
function describe(error: unknown): { title: string; description?: string; stale: boolean } {
  if (!ApiError.isApiError(error)) return { title: "Couldn't start the payment", description: "Try again in a moment.", stale: false };
  if (error.isNetworkError || error.status >= 500) {
    return { title: "Payments are unavailable right now", description: "Nothing was charged. Try again in a minute.", stale: false };
  }
  if (error.status === 422) {
    return { title: "This amount is too small to pay by card", description: "Stripe needs at least $0.50. Contact us to settle it another way.", stale: false };
  }
  if (error.isConflict) {
    if (/already/i.test(error.message)) return { title: "This shipment is already paid", description: "We've refreshed it for you.", stale: true };
    if (/being prepared/i.test(error.message)) return { title: "Your checkout is still being prepared", description: "Wait a few seconds, then press Pay again.", stale: false };
    return { title: "This shipment can't be paid", description: "It was cancelled, returned or delivered, so there's nothing to pay. We've refreshed it for you.", stale: true };
  }
  if (error.isNotFound) return { title: "We can't find that shipment", description: "It may belong to another account.", stale: true };
  if (error.isRateLimited) return { title: "Too many attempts", description: "Wait a minute, then try again.", stale: false };
  return { title: "Couldn't start the payment", description: error.message, stale: false };
}

/**
 * Starts (or reuses) a Stripe Checkout session for one shipment and sends the browser there.
 * `redirecting` stays true after success so the button keeps its pending state until Stripe loads.
 * Nothing is marked paid here: only the webhook or /payments/verify does that.
 */
export function usePayShipment() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [redirecting, setRedirecting] = useState(false);

  const mutation = useMutation({
    mutationFn: (shipmentId: string) => apiFetch<CheckoutSession>(endpoints.payments.initiate, { method: "POST", body: { shipmentId } }),
    onSuccess: ({ data }) => {
      if (!isStripeCheckout(data.checkoutUrl)) {
        toast.error("Couldn't open the payment page", { description: "Try again in a moment." });
        return;
      }
      setRedirecting(true);
      window.location.assign(data.checkoutUrl);
    },
    onError: (error) => {
      const { title, description, stale } = describe(error);
      toast.error(title, { description });
      if (stale) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
        router.refresh();
      }
    },
  });

  return { pay: mutation.mutate, pending: mutation.isPending || redirecting };
}
