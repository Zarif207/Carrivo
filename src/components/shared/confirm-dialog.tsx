"use client";

// Client: dialog open state and the pending confirm action.
import { Loader2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ConfirmDialogProps {
  /** Element that opens the dialog (omit when controlling `open`). */
  trigger?: ReactNode;
  title: string;
  description: ReactNode;
  /** Name the action, e.g. "Cancel shipment" (the toast should use the same words). */
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "default" | "destructive";
  /** Resolve to close; throw to keep the dialog open (the caller shows the error toast). */
  onConfirm: () => Promise<unknown> | unknown;
  /** Extra content, e.g. a reason field. */
  children?: ReactNode;
  /** Disable confirm, e.g. until a required field is valid. */
  confirmDisabled?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Where focus goes on close (controlled dialogs opened from a menu item that no longer exists). */
  onCloseAutoFocus?: (event: Event) => void;
}

export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel,
  cancelLabel = "Go back",
  tone = "default",
  onConfirm,
  children,
  confirmDisabled = false,
  open: controlledOpen,
  onOpenChange,
  onCloseAutoFocus,
}: ConfirmDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;

  const setOpen = (next: boolean) => {
    if (pending) return; // don't close mid-request
    onOpenChange?.(next);
    if (controlledOpen === undefined) setUncontrolledOpen(next);
  };

  const confirm = async () => {
    setPending(true);
    try {
      await onConfirm();
      setPending(false);
      onOpenChange?.(false);
      if (controlledOpen === undefined) setUncontrolledOpen(false);
    } catch {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="sm:max-w-md" showCloseButton={!pending} onCloseAutoFocus={onCloseAutoFocus}>
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={pending}>
              {cancelLabel}
            </Button>
          </DialogClose>
          <Button
            variant={tone === "destructive" ? "destructive" : "default"}
            className={tone === "destructive" ? "bg-danger text-danger-foreground hover:bg-danger/90 dark:bg-danger dark:hover:bg-danger/90" : undefined}
            onClick={confirm}
            disabled={pending || confirmDisabled}
            aria-busy={pending}
          >
            {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
