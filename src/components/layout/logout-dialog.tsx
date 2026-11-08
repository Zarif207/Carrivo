"use client";

// Client: one logout confirmation per dashboard, opened from the sidebar, the user menu or the mobile sheet.
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useAuth } from "@/hooks/use-auth";

/** Opens the dialog; `returnTo` gets focus back when it closes (the control the user acted on). */
type RequestLogout = (returnTo?: HTMLElement | null) => void;

const LogoutContext = createContext<RequestLogout | null>(null);

/** Opens the logout confirmation. Must be used inside <LogoutProvider> (the dashboard shell). */
export function useRequestLogout(): RequestLogout {
  const request = useContext(LogoutContext);
  if (!request) throw new Error("useRequestLogout must be used inside LogoutProvider");
  return request;
}

export function LogoutProvider({ children }: { children: ReactNode }) {
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);
  // Where focus returns on close. Callers pass a control that outlives the dialog (a menu item
  // unmounts with its menu, so the user menu passes its trigger); otherwise the focused element.
  const returnFocus = useRef<HTMLElement | null>(null);
  const request = useCallback<RequestLogout>((returnTo) => {
    returnFocus.current = returnTo ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    setOpen(true);
  }, []);

  const restoreFocus = (event: Event) => {
    const target = returnFocus.current;
    if (target?.isConnected) {
      event.preventDefault();
      target.focus();
    }
  };

  const confirm = async () => {
    try {
      await logout(); // success replaces the page with /login
    } catch (error) {
      toast.error("Couldn't log out. Check your connection and try again.");
      throw error; // keeps the dialog open
    }
  };

  return (
    <LogoutContext.Provider value={request}>
      {children}
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Log out of Carrivo?"
        description="You'll need to sign in again to see your account."
        cancelLabel="Cancel"
        confirmLabel="Log out"
        onConfirm={confirm}
        onCloseAutoFocus={restoreFocus}
      />
    </LogoutContext.Provider>
  );
}
