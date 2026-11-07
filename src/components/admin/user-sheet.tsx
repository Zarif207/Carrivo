"use client";

// Client: side sheet for one user, filled from the list row (there is no single-user endpoint), with
// activate / deactivate behind a confirm dialog and an optimistic status.
import { UserCheck, UserX } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { RoleGate } from "@/components/auth/role-gate";
import { UserAvatar } from "@/components/layout/user-menu";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { DetailRows, PhoneLink, type DetailRow } from "@/components/shipments/detail-parts";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useUrlState } from "@/hooks/use-url-state";
import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { formatDateTime } from "@/lib/format";
import { VEHICLE_NAMES } from "@/lib/status";
import type { AdminUser, UserStatus } from "@/types";

const reasonOk = (r: string) => r === "" || (r.length >= 3 && r.length <= 500);

function StatusAction({ user, status, onStatus }: { user: AdminUser; status: UserStatus; onStatus: (s: UserStatus) => void }) {
  const router = useRouter();
  const { user: me } = useAuth();
  const [reason, setReason] = useState("");
  const [, startTransition] = useTransition();
  const deactivating = status === "ACTIVE";
  const isSelf = me?.id === user.id;
  const trimmed = reason.trim();

  const change = async () => {
    const next: UserStatus = deactivating ? "INACTIVE" : "ACTIVE";
    onStatus(next); // optimistic
    try {
      await apiFetch<AdminUser>(endpoints.admin.userStatus(user.id), { method: "PATCH", body: trimmed ? { status: next, reason: trimmed } : { status: next } });
      toast.success(deactivating ? "Account deactivated" : "Account reactivated", {
        description: deactivating ? `${user.name} is signed out everywhere.` : `${user.name} can sign in again.`,
      });
      setReason("");
      startTransition(() => router.refresh());
    } catch (error) {
      onStatus(status); // rollback
      toast.error(deactivating ? "Couldn't deactivate" : "Couldn't reactivate", { description: ApiError.isApiError(error) ? error.message : "Try again in a moment." });
      throw error; // keeps the dialog open
    }
  };

  if (isSelf) return <p className="rounded-lg bg-secondary px-3 py-2.5 text-sm">This is your account. Another admin has to deactivate it.</p>;

  return (
    <ConfirmDialog
      trigger={
        <Button variant={deactivating ? "outline" : "default"} className="w-full">
          {deactivating ? <UserX aria-hidden="true" /> : <UserCheck aria-hidden="true" />} {deactivating ? "Deactivate account" : "Reactivate account"}
        </Button>
      }
      tone={deactivating ? "destructive" : "default"}
      title={deactivating ? `Deactivate ${user.name}?` : `Reactivate ${user.name}?`}
      description={
        deactivating
          ? `They're signed out on every device and can't sign in.${user.role === "COURIER" ? " A courier with active shipments can't be deactivated until those are reassigned." : ""}`
          : "They can sign in again with their existing password."
      }
      confirmLabel={deactivating ? "Deactivate" : "Reactivate"}
      cancelLabel="Go back"
      confirmDisabled={!reasonOk(trimmed)}
      onConfirm={change}
    >
      <div className="space-y-2">
        <Label htmlFor="status-reason">
          Reason <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Textarea id="status-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} rows={2} aria-invalid={!reasonOk(trimmed) || undefined} />
        <p className={reasonOk(trimmed) ? "text-xs text-muted-foreground" : "text-xs font-medium text-danger"}>Kept in the audit log. 3 to 500 characters.</p>
      </div>
    </ConfirmDialog>
  );
}

/** Keyed on id + status: a fresh server render after a change remounts it with the confirmed status. */
function UserSheetBody({ user }: { user: AdminUser }) {
  const [status, setStatus] = useState<UserStatus>(user.status);
  const p = user.courierProfile;
  return (
    <>
      <SheetHeader className="space-y-3 text-left">
        <div className="flex items-center gap-4">
          <UserAvatar user={user} className="size-14 text-base" />
          <div className="min-w-0">
            <SheetTitle className="truncate text-xl">{user.name}</SheetTitle>
            <SheetDescription className="truncate">{user.email}</SheetDescription>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge kind="role" status={user.role} size="sm" />
          <StatusBadge kind="user" status={status} size="sm" />
        </div>
      </SheetHeader>
      <div className="space-y-6 px-4 pb-6">
        <DetailRows
          rows={[
            ["Phone", user.phone ? <PhoneLink key="p" phone={user.phone} /> : "Not set"],
            ["Address", user.address ?? "Not set"],
            ["Email verified", user.emailVerified ? "Yes" : "No"],
            ["Joined", formatDateTime(user.createdAt)],
            ["Last updated", formatDateTime(user.updatedAt)],
          ]}
        />
        {p ? (
          <div className="space-y-3">
            <h3 className="font-bold">Courier</h3>
            <DetailRows
              rows={[
                ["Availability", p.isAvailable ? "Available for new tasks" : "Paused"],
                ["Vehicle", VEHICLE_NAMES[p.vehicleType]],
                ...(p.vehicleNumber ? [["Number plate", <span key="v" className="font-id">{p.vehicleNumber}</span>] as DetailRow] : []),
                ["Zone", p.zone.name],
                ["Hub", p.hub?.name ?? "Not assigned"],
              ]}
            />
          </div>
        ) : null}
        <RoleGate allow="ADMIN">
          <StatusAction user={user} status={status} onStatus={setStatus} />
        </RoleGate>
      </div>
    </>
  );
}

export function UserSheet({ user, missing }: { user: AdminUser | null; missing: boolean }) {
  const { get, set } = useUrlState();
  const open = Boolean(get("view"));
  const close = () => set({ view: null }, { resetPage: false });

  return (
    <Sheet open={open} onOpenChange={(next) => (next ? undefined : close())}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {user ? (
          <UserSheetBody key={`${user.id}:${user.status}`} user={user} />
        ) : (
          <SheetHeader>
            <SheetTitle>User not found</SheetTitle>
            <SheetDescription>
              {missing ? "This user isn't in the first 100 accounts. Search for them by name or email instead." : "Pick someone from the list."}
            </SheetDescription>
          </SheetHeader>
        )}
      </SheetContent>
    </Sheet>
  );
}
