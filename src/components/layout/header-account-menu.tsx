"use client";

// Client: the public header's signed-in account area (avatar menu, and the same links in the mobile
// sheet). Each carries its own logout confirmation; in the sheet it opens on top of the sheet, so
// Cancel returns to the sheet's Log out button.
import { LayoutDashboard, LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ROLE_HOME, ROLE_LABEL, ROLE_PROFILE } from "@/config/nav";
import { useCloseHeaderSheet } from "./header-account-client";
import { LogoutProvider, useRequestLogout } from "./logout-dialog";
import { UserAvatar, UserMenu, type ShellUser } from "./user-menu";

export function DesktopAccount({ user }: { user: ShellUser }) {
  return (
    <LogoutProvider>
      <UserMenu user={user} context="public" />
    </LogoutProvider>
  );
}

function MobileLinks({ user }: { user: ShellUser }) {
  const close = useCloseHeaderSheet();
  const requestLogout = useRequestLogout();
  return (
    <>
      <div className="flex items-center gap-3 px-1 pb-2">
        <UserAvatar user={user} className="size-11" />
        <div className="min-w-0">
          <p className="truncate font-semibold">{user.name}</p>
          <p className="truncate text-sm text-muted-foreground">{ROLE_LABEL[user.role]} account</p>
        </div>
      </div>
      <Button asChild size="lg">
        <Link href={ROLE_HOME[user.role]} onClick={close}>
          <LayoutDashboard aria-hidden="true" /> Dashboard
        </Link>
      </Button>
      <Button asChild variant="outline" size="lg">
        <Link href={ROLE_PROFILE[user.role]} onClick={close}>
          <UserRound aria-hidden="true" /> Profile
        </Link>
      </Button>
      <Button type="button" variant="ghost" size="lg" onClick={(event) => requestLogout(event.currentTarget)}>
        <LogOut aria-hidden="true" /> Log out
      </Button>
    </>
  );
}

export function MobileAccount({ user }: { user: ShellUser }) {
  return (
    <LogoutProvider>
      <MobileLinks user={user} />
    </LogoutProvider>
  );
}
