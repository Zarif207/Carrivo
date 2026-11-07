import { CircleX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { Suspense } from "react";
import { PaymentResult, PaymentResultSkeleton } from "@/components/payments/payment-result";
import { PaymentVerifier } from "@/components/payments/payment-verifier";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/errors";
import { verifyMyPayment } from "@/lib/data/customer";
import { firstParam, type RawSearchParams } from "@/lib/list-params";
import { CHECKOUT_SESSION_ID } from "@/lib/payments/payable";
import type { PaymentVerification } from "@/types";

export const metadata: Metadata = { title: "Payment", robots: { index: false } };

function UnknownPayment({ reason }: { reason: "missing" | "not-found" }) {
  return (
    <PaymentResult
      icon={CircleX}
      tone="stone"
      title={reason === "missing" ? "This payment link is incomplete" : "We can't find this payment"}
      description={
        reason === "missing"
          ? "Stripe sends you back here with a session reference, and this link doesn't have one. Your payment history shows every payment you've made."
          : "It may belong to another account. Your payment history shows every payment you've made."
      }
      actions={
        <>
          <Button variant="outline" asChild>
            <Link href="/dashboard/shipments">Your shipments</Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/payments">Payment history</Link>
          </Button>
        </>
      }
    />
  );
}

/**
 * Stripe returns to FRONTEND_SUCCESS_URL?session_id=cs_… The redirect proves nothing: the status
 * comes from GET /payments/verify (Stripe looked up server-side; reconciles a missed webhook), so
 * refreshing this page is safe. The first check runs here; the client keeps polling if needed.
 */
async function Verify({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const sessionId = firstParam((await searchParams).session_id);
  if (!sessionId || !CHECKOUT_SESSION_ID.test(sessionId)) return <UnknownPayment reason="missing" />;

  let initial: PaymentVerification | null = null;
  try {
    initial = await verifyMyPayment(sessionId);
  } catch (error) {
    unstable_rethrow(error);
    if (ApiError.isApiError(error) && (error.isNotFound || error.status === 400)) return <UnknownPayment reason="not-found" />;
    // Anything else (API slow or down): the client retries and explains.
  }
  return <PaymentVerifier key={sessionId} sessionId={sessionId} initial={initial} />;
}

export default function PaymentSuccessPage({ searchParams }: PageProps<"/payment/success">) {
  return (
    <div className="py-4 sm:py-10">
      <Suspense fallback={<PaymentResultSkeleton />}>
        <Verify searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
