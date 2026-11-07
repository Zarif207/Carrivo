"use client";

// Client: polls GET /payments/verify while Stripe hasn't confirmed yet, then shows the real outcome.
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Clock, CircleX, Loader2, RotateCcw, RotateCw, TimerOff, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/api/query-keys";
import { formatDateTime, formatMoney } from "@/lib/format";
import { isPayable } from "@/lib/payments/payable";
import type { Tone } from "@/lib/status";
import type { Payment, PaymentVerification } from "@/types";
import { PayButton } from "./pay-button";
import { PaymentResult } from "./payment-result";

/** How long to keep asking before saying "still processing" (the webhook can lag the redirect). */
const WINDOW_MS = 15_000;
const POLL_MS = 2_000;
const TICK_MS = 250;

/** Final unless PENDING with a completed checkout (Stripe confirmed the session but not yet the money). An open session won't finish by itself. */
const isSettled = (v: PaymentVerification | undefined) => Boolean(v && (v.payment.status !== "PENDING" || v.stripe.sessionStatus === "open"));

const shipmentHref = (p: Payment) => `/dashboard/shipments/${p.shipment.id}`;

function receipt(p: Payment, paidLabel = "Paid"): { label: string; value: ReactNode }[] {
  const rows: { label: string; value: ReactNode }[] = [
    { label: "Shipment", value: <span className="font-id">{p.shipment.trackingId}</span> },
    { label: "Amount", value: <span className="tabular">{formatMoney(p.paidAmount ?? p.amount)}</span> },
  ];
  if (p.paidAt) rows.push({ label: paidLabel, value: formatDateTime(p.paidAt) });
  if (p.refundedAt) rows.push({ label: "Refunded", value: formatDateTime(p.refundedAt) });
  return rows;
}

interface Outcome {
  icon: LucideIcon;
  tone: Tone;
  title: string;
  description: ReactNode;
  retry: boolean;
}

/** What a settled (or timed-out) verification means for the customer. */
function outcomeFor({ payment, stripe }: PaymentVerification): Outcome {
  switch (payment.status) {
    case "PAID":
      return { icon: BadgeCheck, tone: "green", title: "Payment received", description: "Thanks. Your shipment is paid and goes into the pickup queue.", retry: false };
    case "REFUND_PENDING":
      return { icon: RotateCw, tone: "violet", title: "Refund on its way", description: "This shipment was cancelled after you paid, so the money is going back to your card.", retry: false };
    case "REFUNDED":
      return { icon: RotateCcw, tone: "sky", title: "This payment was refunded", description: "The money went back to the card you paid with.", retry: false };
    case "EXPIRED":
      return { icon: TimerOff, tone: "stone", title: "This checkout expired", description: "Nothing was charged. Start a new payment to pay for the shipment.", retry: true };
    case "FAILED":
      return { icon: CircleX, tone: "red", title: "The payment didn't go through", description: payment.failureReason ?? "Nothing was charged. Try again or use another card.", retry: true };
    case "PENDING":
      // Stripe says the checkout is still open: the customer never finished paying.
      if (stripe.sessionStatus === "open") {
        return {
          icon: CircleX,
          tone: "amber",
          title: "The payment isn't finished",
          description: payment.failureReason ? `Stripe said: ${payment.failureReason}. Nothing was charged.` : "Nothing was charged yet. Pick up where you left off.",
          retry: true,
        };
      }
      return {
        icon: Clock,
        tone: "amber",
        title: "Still processing",
        description: "Stripe hasn't confirmed this payment yet. We'll update the shipment and send you a notification as soon as it does.",
        retry: false,
      };
  }
}

export function PaymentVerifier({ sessionId, initial }: { sessionId: string; initial: PaymentVerification | null }) {
  const queryClient = useQueryClient();
  const [elapsed, setElapsed] = useState(0);
  const [round, setRound] = useState(0); // "Check again" starts a new window

  const query = useQuery({
    queryKey: [...queryKeys.payments.verify(sessionId), round],
    queryFn: async () => (await apiFetch<PaymentVerification>(endpoints.payments.verify, { query: { session_id: sessionId } })).data,
    initialData: round === 0 ? (initial ?? undefined) : undefined,
    // A settled first answer from the server needs no second request.
    staleTime: (q) => (isSettled(q.state.data) ? Infinity : 0),
    refetchInterval: (q) => (isSettled(q.state.data) || elapsed >= WINDOW_MS ? false : POLL_MS),
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const restart = () => {
    setElapsed(0);
    setRound((r) => r + 1);
  };

  const data = query.data;
  const settled = isSettled(data);
  const checking = !settled && elapsed < WINDOW_MS;

  // The visible progress clock (no Date.now(): this also renders on the server).
  useEffect(() => {
    if (!checking) return;
    const timer = setTimeout(() => setElapsed((ms) => ms + TICK_MS), TICK_MS);
    return () => clearTimeout(timer);
  }, [checking, elapsed]);

  // Once paid, everything that shows payment state is stale: shipment, payments, badge, stats.
  const announced = useRef(false);
  useEffect(() => {
    if (data?.payment.status !== "PAID" || announced.current) return;
    announced.current = true;
    void queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
    void queryClient.invalidateQueries({ queryKey: queryKeys.shipments.all });
    void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
  }, [data, queryClient]);

  // Move focus to the result heading when the outcome appears, so screen readers hear it.
  useEffect(() => {
    if (!checking) document.getElementById("payment-result-title")?.focus();
  }, [checking]);

  if (!data && query.isError && !checking) {
    return (
      <PaymentResult
        icon={CircleX}
        tone="red"
        title="We couldn't check this payment"
        description="Our payment service didn't answer. If you completed checkout, you won't be charged twice: check again in a moment."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/dashboard/payments">Payment history</Link>
            </Button>
            <Button onClick={restart}>
              <RotateCw aria-hidden="true" /> Check again
            </Button>
          </>
        }
      />
    );
  }

  if (checking || !data) {
    const percent = Math.min(100, Math.round((elapsed / WINDOW_MS) * 100));
    return (
      <PaymentResult
        icon={Loader2}
        busy
        tone="slate"
        title="Confirming your payment"
        description="We're checking with Stripe. This usually takes a few seconds. Please keep this page open."
        details={data ? receipt(data.payment) : undefined}
      >
        <div className="mt-6 space-y-2">
          <div
            role="progressbar"
            aria-label="Confirming payment"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            className="h-2 overflow-hidden rounded-full bg-muted"
          >
            <div className="h-full rounded-full bg-brand transition-[width] duration-300 ease-linear motion-reduce:transition-none" style={{ width: `${percent}%` }} />
          </div>
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {elapsed < 4000 ? "Contacting Stripe…" : elapsed < 10000 ? "Waiting for Stripe to confirm…" : "Almost there…"}
          </p>
        </div>
      </PaymentResult>
    );
  }

  const outcome = outcomeFor(data);
  const { payment } = data;
  const canRetry = outcome.retry && isPayable(payment.shipment);
  const timedOut = payment.status === "PENDING" && data.stripe.sessionStatus !== "open";

  return (
    <PaymentResult
      icon={outcome.icon}
      tone={outcome.tone}
      title={outcome.title}
      description={outcome.description}
      details={receipt(payment)}
      actions={
        <>
          <Button variant={canRetry || timedOut ? "outline" : "default"} asChild>
            <Link href={shipmentHref(payment)}>View shipment</Link>
          </Button>
          {payment.status === "PAID" ? (
            <Button variant="outline" asChild>
              <Link href="/dashboard/payments">Payment history</Link>
            </Button>
          ) : null}
          {timedOut ? (
            <Button onClick={restart}>
              <RotateCw aria-hidden="true" /> Check again
            </Button>
          ) : null}
          {canRetry ? <PayButton shipmentId={payment.shipment.id} amount={payment.amount} label="Try again" showAmount={false} /> : null}
        </>
      }
    />
  );
}
