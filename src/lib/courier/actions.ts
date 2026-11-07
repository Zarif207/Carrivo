import { CircleX, PackageCheck, PackageOpen, RotateCw, type LucideIcon } from "lucide-react";
import { MAX_DELIVERY_ATTEMPTS, getAllowedNextStatuses, type ShipmentStatus } from "@/types";

/** The status moves a courier can make (contract §2 state machine, §6 PATCH /shipments/:id/status). */
export type CourierTarget = "PICKED_UP" | "DELIVERED" | "FAILED_DELIVERY" | "OUT_FOR_DELIVERY";

export interface CourierAction {
  label: string;
  icon: LucideIcon;
  title: string;
  description: string;
  confirmLabel: string;
  /** Toast after success, in the button's words. */
  done: string;
  /** FAILED_DELIVERY needs a note (3-500); the others take an optional one. */
  noteRequired: boolean;
  noteLabel: string;
  tone: "default" | "destructive";
}

export const COURIER_ACTIONS: Record<CourierTarget, CourierAction> = {
  PICKED_UP: {
    label: "Mark picked up",
    icon: PackageOpen,
    title: "Picked up this parcel?",
    description: "Confirm you have the parcel in hand.",
    confirmLabel: "Mark picked up",
    done: "Marked picked up",
    noteRequired: false,
    noteLabel: "Note",
    tone: "default",
  },
  DELIVERED: {
    label: "Mark delivered",
    icon: PackageCheck,
    title: "Delivered to the receiver?",
    description: "Confirm the receiver has the parcel. This completes the shipment and adds your earning.",
    confirmLabel: "Mark delivered",
    done: "Marked delivered",
    noteRequired: false,
    noteLabel: "Note",
    tone: "default",
  },
  FAILED_DELIVERY: {
    label: "Couldn't deliver",
    icon: CircleX,
    title: "Report a failed delivery",
    description: "Say what happened. You can retry the delivery later.",
    confirmLabel: "Report failed delivery",
    done: "Failed delivery reported",
    noteRequired: true,
    noteLabel: "What happened?",
    tone: "destructive",
  },
  OUT_FOR_DELIVERY: {
    label: "Retry delivery",
    icon: RotateCw,
    title: "Start another delivery attempt?",
    description: "The shipment goes back out for delivery with you.",
    confirmLabel: "Retry delivery",
    done: "Out for delivery again",
    noteRequired: false,
    noteLabel: "Note",
    tone: "default",
  },
};

const isCourierTarget = (status: ShipmentStatus): status is CourierTarget => status in COURIER_ACTIONS;

/** Only the moves the contract allows a courier from here (the API still decides). */
export function courierNextActions(status: ShipmentStatus, failedAttempts: number): CourierTarget[] {
  return getAllowedNextStatuses(status, failedAttempts, "COURIER").filter(isCourierTarget);
}

/** One line telling the courier what happens next. */
export function courierHint(status: ShipmentStatus, failedAttempts: number): string {
  switch (status) {
    case "PENDING":
    case "PICKUP_SCHEDULED":
      return "Not assigned to you yet.";
    case "COURIER_ASSIGNED":
      return "Collect the parcel from the sender, then mark it picked up.";
    case "PICKED_UP":
      return "Drop it at the origin hub. The hub team moves it from there.";
    case "AT_ORIGIN_HUB":
    case "IN_TRANSIT":
    case "AT_DESTINATION_HUB":
      return "With the hub team. It comes back to you when it's out for delivery.";
    case "OUT_FOR_DELIVERY":
      return "Hand it to the receiver, add a proof photo, then mark it delivered.";
    case "FAILED_DELIVERY":
      return failedAttempts < MAX_DELIVERY_ATTEMPTS
        ? `${failedAttempts} of ${MAX_DELIVERY_ATTEMPTS} attempts used. Retry when you're ready.`
        : `All ${MAX_DELIVERY_ATTEMPTS} attempts used. An admin will return it to the sender.`;
    case "DELIVERED":
      return "Delivered. You earn 20% of the shipment price.";
    case "RETURNED":
      return "Returned to the sender.";
    case "CANCELLED":
      return "Cancelled. Nothing more to do.";
  }
}

/** Proof photos are accepted only while OUT_FOR_DELIVERY or DELIVERED (POST /shipments/:id/proof). */
export const PROOF_STATUSES: readonly ShipmentStatus[] = ["OUT_FOR_DELIVERY", "DELIVERED"];
