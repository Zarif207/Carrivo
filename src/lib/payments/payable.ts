import { TERMINAL_STATUSES, type ShipmentPaymentStatus, type ShipmentStatus } from "@/types";

/**
 * Mirrors POST /payments/initiate's checks (payment.service): the shipment is UNPAID and not
 * CANCELLED, RETURNED or DELIVERED. Ownership, the USD currency and the $0.50 Stripe minimum are
 * checked by the API; the UI only uses this to decide whether to show "Pay".
 */
export function isPayable(shipment: { status: ShipmentStatus; paymentStatus: ShipmentPaymentStatus }): boolean {
  return shipment.paymentStatus === "UNPAID" && !(TERMINAL_STATUSES as readonly ShipmentStatus[]).includes(shipment.status);
}

/** Stripe Checkout Session ids, as validated by GET /payments/verify. */
export const CHECKOUT_SESSION_ID = /^cs_(test|live)_[A-Za-z0-9]+$/;
