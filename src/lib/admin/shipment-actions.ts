import { ArrowRightLeft, Ban, Building2, Truck, Undo2, UserMinus, UserPlus, Warehouse, type LucideIcon } from "lucide-react";
import { getAllowedNextStatuses, type ShipmentStatus } from "@/types";

/*
 * What an admin can do next, from the contract's state machine (§2): assign / unassign courier,
 * the four hub steps, return after a failed delivery, and cancel before pickup. The API still decides.
 */

export type AdminActionKind = "assign" | "reassign" | "unassign" | "status" | "cancel";

export interface AdminAction {
  key: string;
  kind: AdminActionKind;
  /** Target for PATCH /status (kind "status"). */
  target?: ShipmentStatus;
  /** Status the shipment shows optimistically while the request runs. */
  optimistic: ShipmentStatus;
  label: string;
  icon: LucideIcon;
  title: string;
  description: string;
  confirmLabel: string;
  done: string;
  tone: "default" | "destructive";
  /** Offer a hub picker (AT_ORIGIN_HUB / AT_DESTINATION_HUB). */
  hub?: "origin" | "destination";
}

const STATUS_STEPS: Partial<Record<ShipmentStatus, Omit<AdminAction, "key" | "kind" | "target" | "optimistic">>> = {
  AT_ORIGIN_HUB: { label: "Received at origin hub", icon: Warehouse, title: "Mark received at the origin hub?", description: "The courier has dropped the parcel at the hub.", confirmLabel: "Mark at origin hub", done: "Marked at origin hub", tone: "default", hub: "origin" },
  IN_TRANSIT: { label: "Send in transit", icon: Truck, title: "Send it on its way?", description: "The parcel has left the origin hub for the destination hub.", confirmLabel: "Mark in transit", done: "Marked in transit", tone: "default" },
  AT_DESTINATION_HUB: { label: "Received at destination hub", icon: Building2, title: "Mark received at the destination hub?", description: "The parcel has arrived at the hub closest to the receiver.", confirmLabel: "Mark at destination hub", done: "Marked at destination hub", tone: "default", hub: "destination" },
  OUT_FOR_DELIVERY: { label: "Send out for delivery", icon: Truck, title: "Send it out for delivery?", description: "The assigned courier takes it to the receiver.", confirmLabel: "Send out for delivery", done: "Out for delivery", tone: "default" },
  RETURNED: { label: "Return to sender", icon: Undo2, title: "Return this parcel to the sender?", description: "Use this after failed deliveries. It ends the shipment.", confirmLabel: "Return to sender", done: "Marked returned", tone: "destructive" },
};

export function adminNextActions(status: ShipmentStatus, failedAttempts: number): AdminAction[] {
  const allowed = getAllowedNextStatuses(status, failedAttempts, "ADMIN");
  const actions: AdminAction[] = [];
  for (const to of allowed) {
    if (to === "COURIER_ASSIGNED") {
      actions.push({ key: "assign", kind: "assign", optimistic: "COURIER_ASSIGNED", label: "Assign courier", icon: UserPlus, title: "Assign a courier", description: "Only active, available couriers working in the origin zone can take it.", confirmLabel: "Assign", done: "Courier assigned", tone: "default" });
    } else if (to === "PICKUP_SCHEDULED" && status === "COURIER_ASSIGNED") {
      actions.push({ key: "reassign", kind: "reassign", optimistic: "COURIER_ASSIGNED", label: "Reassign", icon: ArrowRightLeft, title: "Reassign to another courier", description: "The current courier is removed and the one you pick takes over.", confirmLabel: "Reassign", done: "Courier reassigned", tone: "default" });
      actions.push({ key: "unassign", kind: "unassign", optimistic: "PICKUP_SCHEDULED", label: "Unassign", icon: UserMinus, title: "Remove the courier?", description: "The shipment goes back to waiting for a courier.", confirmLabel: "Unassign courier", done: "Courier unassigned", tone: "default" });
    } else if (to === "CANCELLED") {
      actions.push({ key: "cancel", kind: "cancel", optimistic: "CANCELLED", label: "Cancel shipment", icon: Ban, title: "Cancel this shipment?", description: "It hasn't been picked up yet. A paid shipment is refunded to the customer's card.", confirmLabel: "Cancel shipment", done: "Shipment cancelled", tone: "destructive" });
    } else if (STATUS_STEPS[to]) {
      actions.push({ key: to, kind: "status", target: to, optimistic: to, ...STATUS_STEPS[to] });
    }
  }
  return actions;
}
