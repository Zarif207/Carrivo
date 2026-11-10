"use client";

// Client: the public header's signed-out actions (also the Suspense fallback). Kept apart from the
// signed-in menu so signed-out visitors don't download the menu, the logout dialog or the auth hook.
import Link from "next/link";
import { createContext, useContext } from "react";
import { Button } from "@/components/ui/button";

/** Closes the mobile menu sheet (a no-op outside it). */
export const HeaderSheetContext = createContext<() => void>(() => {});

export function useCloseHeaderSheet() {
  return useContext(HeaderSheetContext);
}

export function SignedOutActions({ variant }: { variant: "desktop" | "mobile" }) {
  const close = useCloseHeaderSheet();
  if (variant === "desktop") {
    return (
      <>
        <Button asChild variant="ghost" className="hidden sm:inline-flex">
          <Link href="/login">Log in</Link>
        </Button>
        <Button asChild className="hidden sm:inline-flex">
          <Link href="/register">Send a parcel</Link>
        </Button>
      </>
    );
  }
  return (
    <>
      <Button asChild size="lg">
        <Link href="/register" onClick={close}>
          Send a parcel
        </Link>
      </Button>
      <Button asChild variant="outline" size="lg">
        <Link href="/login" onClick={close}>
          Log in
        </Link>
      </Button>
    </>
  );
}
