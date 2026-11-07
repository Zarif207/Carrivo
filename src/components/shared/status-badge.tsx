import {
  PAYMENT_STATUS_META,
  SHIPMENT_PAYMENT_STATUS_META,
  SHIPMENT_STATUS_META,
  TONE_CLASSES,
  type StatusMeta,
} from "@/lib/status";
import { cn } from "@/lib/utils";
import type { PaymentStatus, ShipmentPaymentStatus, ShipmentStatus } from "@/types";

type StatusBadgeProps = (
  | { kind: "shipment"; status: ShipmentStatus }
  | { kind: "payment"; status: PaymentStatus }
  | { kind: "shipment-payment"; status: ShipmentPaymentStatus }
) & {
  size?: "sm" | "md";
  className?: string;
};

function metaFor(props: StatusBadgeProps): StatusMeta {
  switch (props.kind) {
    case "shipment":
      return SHIPMENT_STATUS_META[props.status];
    case "payment":
      return PAYMENT_STATUS_META[props.status];
    case "shipment-payment":
      return SHIPMENT_PAYMENT_STATUS_META[props.status];
  }
}

/** Colour + icon + words, so status never relies on colour alone. */
export function StatusBadge(props: StatusBadgeProps) {
  const { size = "md", className } = props;
  const meta = metaFor(props);
  const Icon = meta.icon;

  return (
    <span
      data-status={props.status}
      title={meta.description}
      className={cn(
        "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full font-semibold whitespace-nowrap",
        size === "sm" ? "h-6 px-2 text-xs" : "h-7 px-2.5 text-[0.8125rem]",
        TONE_CLASSES[meta.tone],
        className,
      )}
    >
      <Icon className={size === "sm" ? "size-3.5" : "size-4"} aria-hidden="true" />
      {meta.label}
    </span>
  );
}
