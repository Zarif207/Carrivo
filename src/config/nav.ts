import {
  Bell,
  Bike,
  CreditCard,
  FileClock,
  LayoutDashboard,
  Package,
  PackagePlus,
  Settings2,
  UserRound,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/types";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  /** Shown in the mobile bottom bar (max 4); the rest go into "More". */
  primary?: boolean;
}

export interface NavLink {
  title: string;
  href: string;
}

/** Public site navigation. */
export const PUBLIC_NAV: NavLink[] = [
  { title: "Track a parcel", href: "/track" },
  { title: "Services", href: "/services" },
  { title: "Pricing", href: "/pricing" },
  { title: "About", href: "/about" },
  { title: "Contact", href: "/contact" },
];

/** Where each role lands after login. */
export const ROLE_HOME: Record<Role, string> = {
  CUSTOMER: "/dashboard",
  COURIER: "/courier",
  ADMIN: "/admin",
};

export const ROLE_LABEL: Record<Role, string> = {
  CUSTOMER: "Customer",
  COURIER: "Courier",
  ADMIN: "Admin",
};

/** Profile page per role (admins have none). */
export const ROLE_PROFILE: Record<Role, string | null> = {
  CUSTOMER: "/dashboard/profile",
  COURIER: "/courier/profile",
  ADMIN: null,
};

export const DASHBOARD_NAV: Record<Role, NavItem[]> = {
  CUSTOMER: [
    { title: "Overview", href: "/dashboard", icon: LayoutDashboard, primary: true },
    { title: "Shipments", href: "/dashboard/shipments", icon: Package, primary: true },
    { title: "New shipment", href: "/dashboard/shipments/new", icon: PackagePlus, primary: true },
    { title: "Payments", href: "/dashboard/payments", icon: CreditCard, primary: true },
    { title: "Notifications", href: "/dashboard/notifications", icon: Bell },
    { title: "Profile", href: "/dashboard/profile", icon: UserRound },
  ],
  COURIER: [
    { title: "Active tasks", href: "/courier", icon: Bike, primary: true },
    { title: "Earnings", href: "/courier/earnings", icon: Wallet, primary: true },
    { title: "Notifications", href: "/courier/notifications", icon: Bell, primary: true },
    { title: "Profile", href: "/courier/profile", icon: UserRound, primary: true },
  ],
  ADMIN: [
    { title: "Overview", href: "/admin", icon: LayoutDashboard, primary: true },
    { title: "Shipments", href: "/admin/shipments", icon: Package, primary: true },
    { title: "Users", href: "/admin/users", icon: Users, primary: true },
    { title: "Payments", href: "/admin/payments", icon: CreditCard, primary: true },
    { title: "Reports", href: "/admin/reports", icon: FileClock },
    { title: "Settings", href: "/admin/settings", icon: Settings2 },
  ],
};

/** Longest-prefix match so /dashboard/shipments/new highlights "New shipment", not "Shipments". */
export function findActiveHref(items: NavItem[], pathname: string): string | undefined {
  return items
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
}

/** Full notifications list per role (admins have none; the bell still works for them). */
export const ROLE_NOTIFICATIONS: Record<Role, string | null> = {
  CUSTOMER: "/dashboard/notifications",
  COURIER: "/courier/notifications",
  ADMIN: null,
};

/** The public site's home page (reachable from every dashboard). */
export const PUBLIC_HOME = "/";
