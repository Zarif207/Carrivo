"use client";

// Client: dropdown state; logout opens the confirmation dialog of the shell or the public header.
import { House, LayoutDashboard, LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PUBLIC_HOME, ROLE_HOME, ROLE_LABEL, ROLE_PROFILE } from "@/config/nav";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Role } from "@/types";
import { useRequestLogout } from "./logout-dialog";

export interface ShellUser {
  name: string;
  email: string;
  image?: string | null;
  role: Role;
}

export function UserAvatar({ user, className }: { user: Pick<ShellUser, "name" | "image">; className?: string }) {
  return (
    <Avatar className={cn("size-9", className)}>
      {user.image ? <AvatarImage src={user.image} alt="" /> : null}
      <AvatarFallback className="bg-signal font-bold text-signal-foreground">{initials(user.name)}</AvatarFallback>
    </Avatar>
  );
}

interface UserMenuProps {
  user: ShellUser;
  /** "dashboard" (default) links back to the public site; "public" (the site header) links to the role's dashboard. */
  context?: "dashboard" | "public";
}

export function UserMenu({ user, context = "dashboard" }: UserMenuProps) {
  const requestLogout = useRequestLogout();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const profileHref = ROLE_PROFILE[user.role];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button ref={triggerRef} variant="ghost" className="h-11 gap-2.5 rounded-full px-1.5 sm:pr-3" aria-label={`Account menu for ${user.name}`}>
          <UserAvatar user={user} />
          <span className="hidden max-w-36 truncate text-sm font-semibold sm:block">{user.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="space-y-0.5 py-2">
          <p className="truncate font-semibold text-foreground">{user.name}</p>
          <p className="truncate text-xs font-normal text-muted-foreground">{user.email}</p>
          <p className="text-xs font-normal text-muted-foreground">{ROLE_LABEL[user.role]} account</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {context === "public" ? (
            <DropdownMenuItem asChild>
              <Link href={ROLE_HOME[user.role]}>
                <LayoutDashboard /> Dashboard
              </Link>
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem asChild>
            <Link href={profileHref}>
              <UserRound /> Profile
            </Link>
          </DropdownMenuItem>
          {context === "dashboard" ? (
            <DropdownMenuItem asChild>
              <Link href={PUBLIC_HOME} prefetch={false}>
                <House /> Back to home
              </Link>
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {/* The menu closes and the confirmation dialog takes focus. */}
          <DropdownMenuItem onSelect={() => requestLogout(triggerRef.current)}>
            <LogOut /> Log out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
