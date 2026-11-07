import type { Currency, DateFilter, ISODateString, Id, Money, PageQuery } from "./common";
import type { PaymentStatus, ShipmentPaymentStatus, ShipmentStatus } from "./enums";

export interface PaymentShipmentRef {
  id: Id;
  trackingId: string;
  status: ShipmentStatus;
  paymentStatus: ShipmentPaymentStatus;
}

/** Extra fields only admins receive (`payment.admin`). */
export interface PaymentAdminInfo {
  customer: { id: Id; name: string; email: string };
  stripeSessionId: string | null;
  stripePaymentIntentId: string | null;
  stripeRefundId: string | null;
  paidCurrency: string | null;
  /** Amount mismatch, duplicate payment or refund failure. */
  requiresReview: boolean;
  reviewReason: string | null;
}

export interface Payment {
  id: Id;
  amount: Money;
  currency: Currency;
  status: PaymentStatus;
  provider: "STRIPE";
  paidAmount: Money | null;
  paidAt: ISODateString | null;
  refundedAt: ISODateString | null;
  expiresAt: ISODateString | null;
  /** Only shown to the owner while the Checkout session is open. */
  checkoutUrl: string | null;
  failureReason: string | null;
  createdAt: ISODateString;
  shipment: PaymentShipmentRef;
  /** Present for ADMIN callers only. */
  admin?: PaymentAdminInfo;
}

export interface AdminPayment extends Payment {
  admin: PaymentAdminInfo;
}

/** POST /payments/initiate (CUSTOMER). */
export type InitiatePaymentInput = {
  shipmentId: Id;
};

/** 201 new session, or 200 with `reused: true` when an open session already exists. */
export interface CheckoutSession {
  paymentId: Id;
  checkoutUrl: string;
  expiresAt: ISODateString;
  amount: Money;
  currency: Currency;
  reused: boolean;
}

/** GET /payments/verify?session_id=cs_... (status looked up server-side at Stripe). */
export interface PaymentVerification {
  payment: Payment;
  stripe: {
    /** Stripe Checkout Session status: "open" | "complete" | "expired". */
    sessionStatus: string;
    /** Stripe payment_status: "paid" | "unpaid" | "no_payment_required". */
    paymentStatus: string;
  };
}

export type PaymentSortBy = "createdAt" | "amount" | "paidAt" | "status";

export type MyPaymentsQuery = PageQuery & {
  sortBy?: PaymentSortBy;
  status?: PaymentStatus;
};

export type AdminPaymentsQuery = MyPaymentsQuery & {
  customerId?: Id;
  shipmentId?: Id;
  requiresReview?: "true" | "false";
  fromDate?: DateFilter;
  toDate?: DateFilter;
};
