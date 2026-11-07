import { PaymentResultSkeleton } from "@/components/payments/payment-result";

export default function PaymentSuccessLoading() {
  return (
    <div className="py-4 sm:py-10">
      <PaymentResultSkeleton />
    </div>
  );
}
