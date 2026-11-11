import {
  Bell,
  Bike,
  ClipboardList,
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
  ADMIN_VIEWER: "/admin",
};

export const ROLE_LABEL: Record<Role, string> = {
  CUSTOMER: "Customer",
  COURIER: "Courier",
  ADMIN: "Admin",
  ADMIN_VIEWER: "Admin (view-only)",
};

/** Profile page per role (the viewer's is read-only). */
export const ROLE_PROFILE: Record<Role, string> = {
  CUSTOMER: "/dashboard/profile",
  COURIER: "/courier/profile",
  ADMIN: "/admin/profile",
  ADMIN_VIEWER: "/admin/profile",
};

const ADMIN_NAV: NavItem[] = [
  { title: "Overview", href: "/admin", icon: LayoutDashboard, primary: true },
  { title: "Shipments", href: "/admin/shipments", icon: Package, primary: true },
  { title: "Users", href: "/admin/users", icon: Users, primary: true },
  { title: "Payments", href: "/admin/payments", icon: CreditCard, primary: true },
  { title: "Courier applications", href: "/admin/courier-applications", icon: ClipboardList },
  { title: "Notifications", href: "/admin/notifications", icon: Bell },
  { title: "Reports", href: "/admin/reports", icon: FileClock },
  { title: "Settings", href: "/admin/settings", icon: Settings2 },
  { title: "Profile", href: "/admin/profile", icon: UserRound },
];

export const DASHBOARD_NAV: Record<Role, NavItem[]> = {
  CUSTOMER: [
    { title: "Overview", href: "/dashboard", icon: LayoutDashboard, primary: true },
    { title: "Shipments", href: "/dashboard/shipments", icon: Package, primary: true },
    { title: "New shipment", href: "/dashboard/shipments/new", icon: PackagePlus, primary: true },
    { title: "Payments", href: "/dashboard/payments", icon: CreditCard, primary: true },
    { title: "Notifications", href: "/dashboard/notifications", icon: Bell },
    { title: "Become a courier", href: "/courier-application", icon: Bike },
    { title: "Profile", href: "/dashboard/profile", icon: UserRound },
  ],
  COURIER: [
    { title: "Active tasks", href: "/courier", icon: Bike, primary: true },
    { title: "Earnings", href: "/courier/earnings", icon: Wallet, primary: true },
    { title: "Notifications", href: "/courier/notifications", icon: Bell, primary: true },
    { title: "Profile", href: "/courier/profile", icon: UserRound, primary: true },
  ],
  ADMIN: ADMIN_NAV,
  // Same pages, read-only (write controls are hidden; see lib/auth/permissions.ts).
  ADMIN_VIEWER: ADMIN_NAV,
};

/** Longest-prefix match so /dashboard/shipments/new highlights "New shipment", not "Shipments". */
export function findActiveHref(items: NavItem[], pathname: string): string | undefined {
  return items
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
}

/** Full notifications list per role: the bell's "View all" target and the nav item carrying the unread badge. */
export const ROLE_NOTIFICATIONS: Record<Role, string | null> = {
  CUSTOMER: "/dashboard/notifications",
  COURIER: "/courier/notifications",
  ADMIN: "/admin/notifications",
  ADMIN_VIEWER: "/admin/notifications",
};

/** Customers apply to become couriers here; staff review the queue at ADMIN_COURIER_APPLICATIONS. */
export const COURIER_APPLICATION_PATH = "/courier-application";
/** The courier recruitment page (public); its buttons lead to COURIER_APPLICATION_PATH. */
export const DRIVE_WITH_CARRIVO_PATH = "/drive-with-carrivo";
export const ADMIN_COURIER_APPLICATIONS = "/admin/courier-applications";

/** The public site's home page (reachable from every dashboard). */
export const PUBLIC_HOME = "/";
