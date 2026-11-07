import { ArrowLeft, Ban, CircleCheck, RotateCcw } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { Suspense } from "react";
import { PayButton } from "@/components/payments/pay-button";
import { PaymentResult, PaymentResultSkeleton } from "@/components/payments/payment-result";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/errors";
import { getMyShipment } from "@/lib/data/customer";
import { formatMoney } from "@/lib/format";
import { UUID } from "@/lib/ids";
import { firstParam, type RawSearchParams } from "@/lib/list-params";
import { isPayable } from "@/lib/payments/payable";
import type { ShipmentDetail } from "@/types";

export const metadata: Metadata = { title: "Payment cancelled", robots: { index: false } };

const NOTHING_CHARGED = "You left Stripe's checkout before paying, so nothing was charged.";

function Generic() {
  return (
    <PaymentResult
      icon={Ban}
      tone="stone"
      title="Payment cancelled"
      description={`${NOTHING_CHARGED} Open the shipment to pay when you're ready.`}
      actions={
        <Button asChild>
          <Link href="/dashboard/shipments">Your shipments</Link>
        </Button>
      }
    />
  );
}

/** Stripe returns to FRONTEND_CANCEL_URL?shipmentId=<id>. The shipment is re-read, so "Try again" only shows if it's still payable. */
async function CancelResult({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const shipmentId = firstParam((await searchParams).shipmentId);
  if (!shipmentId || !UUID.test(shipmentId)) return <Generic />;

  let shipment: ShipmentDetail;
  try {
    shipment = await getMyShipment(shipmentId);
  } catch (error) {
    unstable_rethrow(error);
    if (ApiError.isApiError(error) && (error.isNotFound || error.status === 400)) return <Generic />;
    throw error; // the area error boundary offers a retry
  }

  const back = (
    <Button variant="outline" asChild>
      <Link href={`/dashboard/shipments/${shipment.id}`}>
        <ArrowLeft aria-hidden="true" /> Back to shipment
      </Link>
    </Button>
  );
  const details = [
    { label: "Shipment", value: <span className="font-id">{shipment.trackingId}</span> },
    { label: "Amount", value: <span className="tabular">{formatMoney(shipment.price)}</span> },
    { label: "Payment", value: <StatusBadge kind="shipment-payment" status={shipment.paymentStatus} size="sm" /> },
  ];

  if (shipment.paymentStatus === "PAID") {
    // Paid in another tab (or the webhook landed): don't offer to pay twice.
    return <PaymentResult icon={CircleCheck} tone="green" title="This shipment is already paid" description="A payment for it went through, so there's nothing left to pay." details={details} actions={back} />;
  }

  if (shipment.paymentStatus === "REFUNDED") {
    return <PaymentResult icon={RotateCcw} tone="sky" title="This shipment was refunded" description="It was cancelled after payment, and the money went back to your card." details={details} actions={back} />;
  }

  return (
    <PaymentResult
      icon={Ban}
      tone="stone"
      title="Payment cancelled"
      description={
        isPayable(shipment)
          ? `${NOTHING_CHARGED} Your shipment is saved; it leaves for pickup once it's paid.`
          : `${NOTHING_CHARGED} This shipment can't be paid any more.`
      }
      details={details}
      actions={
        <>
          {back}
          {isPayable(shipment) ? <PayButton shipmentId={shipment.id} amount={shipment.price} label="Try again" showAmount={false} /> : null}
        </>
      }
    />
  );
}

export default function PaymentCancelPage({ searchParams }: PageProps<"/payment/cancel">) {
  return (
    <div className="py-4 sm:py-10">
      <Suspense fallback={<PaymentResultSkeleton />}>
        <CancelResult searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
