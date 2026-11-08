"use client";

// Client: collapsible sidebar (persisted UI state), active nav (usePathname, streamed under Suspense) and the mobile sheet.
import { Ellipsis, House, LogOut, PanelLeftClose, PanelLeftOpen, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { Logo, LogoMark } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DASHBOARD_NAV, PUBLIC_HOME, ROLE_LABEL, findActiveHref, type NavItem } from "@/config/nav";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/ui-store";
import { LogoutProvider, useRequestLogout } from "./logout-dialog";
import { UserMenu, type ShellUser } from "./user-menu";

interface DashboardShellProps {
  user: ShellUser;
  children: ReactNode;
  /** Extra header controls, e.g. the notification bell (Phase 4). */
  headerActions?: ReactNode;
  /** Unread/attention counts keyed by nav href, shown as orange badges. */
  badges?: Partial<Record<string, number>>;
}

const SIDEBAR_HEADINGS = { CUSTOMER: "Shipping", COURIER: "Deliveries", ADMIN: "Operations" } as const;

function CountBadge({ count, className }: { count: number; className?: string }) {
  return (
    <span
      className={cn(
        "grid h-5 min-w-5 place-items-center rounded-full bg-sidebar-primary px-1.5 text-[0.6875rem] font-bold text-sidebar-primary-foreground tabular",
        className,
      )}
    >
      {count > 99 ? "99+" : count}
      <span className="sr-only"> new</span>
    </span>
  );
}

function SidebarLink({
  item,
  active,
  collapsed,
  count,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  count?: number;
  onNavigate?: () => void;
}) {
  const link = (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex h-11 items-center gap-3 rounded-full px-4 text-[0.9375rem] font-semibold outline-none transition-colors",
        "text-sidebar-muted hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        // Active: a soft raised pill.
        active && "bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_6px_14px_-6px_rgb(0_0_0/0.6)]",
        collapsed && "justify-center px-0",
      )}
    >
      <item.icon className={cn("size-5 shrink-0", active && "text-sidebar-primary")} aria-hidden="true" />
      <span className={cn("flex-1 truncate", collapsed && "sr-only")}>{item.title}</span>
      {count ? <CountBadge count={count} className={collapsed ? "absolute -top-0.5 right-0.5" : undefined} /> : null}
    </Link>
  );

  if (!collapsed) return link;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{item.title}</TooltipContent>
    </Tooltip>
  );
}

const SIDEBAR_ACTION =
  "h-11 w-full justify-start gap-3 rounded-full px-4 text-[0.9375rem] font-semibold text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-sidebar-ring dark:hover:bg-sidebar-accent";

/** A sidebar footer action (link or button) that collapses to an icon with a tooltip. */
function SidebarAction({
  icon: Icon,
  label,
  collapsed,
  href,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  collapsed: boolean;
  href?: string;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
}) {
  const content = (
    <>
      <Icon className="size-5 shrink-0" aria-hidden="true" />
      <span className={cn("truncate", collapsed && "sr-only")}>{label}</span>
    </>
  );
  const className = cn(SIDEBAR_ACTION, collapsed && "w-11 justify-center px-0");
  const control = href ? (
    <Button asChild variant="ghost" className={className}>
      <Link href={href} onClick={onClick}>
        {content}
      </Link>
    </Button>
  ) : (
    <Button variant="ghost" className={className} onClick={onClick}>
      {content}
    </Button>
  );
  if (!collapsed) return control;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{control}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

/** Back to the public site and log out: shared by the desktop sidebar and the mobile "More" sheet. */
function AccountActions({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const requestLogout = useRequestLogout();
  return (
    <>
      <SidebarAction icon={House} label="Back to home" href={PUBLIC_HOME} collapsed={collapsed} onClick={onNavigate} />
      <SidebarAction
        icon={LogOut}
        label="Log out"
        collapsed={collapsed}
        onClick={(event) => {
          onNavigate?.();
          // In the mobile sheet the button unmounts with the sheet: fall back to the "More" button.
          requestLogout(onNavigate ? document.querySelector<HTMLElement>("[data-more-trigger]") : event.currentTarget);
        }}
      />
    </>
  );
}

type ActiveRender = (activeHref: string | undefined) => ReactNode;

function LiveActiveHref({ items, children }: { items: NavItem[]; children: ActiveRender }) {
  return <>{children(findActiveHref(items, usePathname()))}</>;
}

/**
 * The pathname is request data on dynamic routes (Cache Components), so highlighted navigation
 * streams in under <Suspense>. The fallback renders the same items unhighlighted: no layout shift.
 */
function WithActiveHref({ items, children }: { items: NavItem[]; children: ActiveRender }) {
  return (
    <Suspense fallback={children(undefined)}>
      <LiveActiveHref items={items}>{children}</LiveActiveHref>
    </Suspense>
  );
}

export function DashboardShell(props: DashboardShellProps) {
  return (
    <LogoutProvider>
      <ShellFrame {...props} />
    </LogoutProvider>
  );
}

/**
 * Scrolling model (one scroll container per breakpoint):
 * - lg and up: the frame is exactly the viewport (h-dvh, overflow hidden) and only the inset content
 *   panel scrolls. The panel is `relative`, so absolutely positioned descendants (sr-only text, chart
 *   tooltips, popover anchors) are laid out inside it and can never stretch the document; globals.css
 *   also locks the document while [data-dashboard-shell] is mounted at lg.
 * - below lg: the document scrolls (min-h-dvh) and the panel does not, so mobile browser chrome and
 *   pull-to-refresh behave normally.
 */
function ShellFrame({ user, children, headerActions, badges = {} }: DashboardShellProps) {
  const items = DASHBOARD_NAV[user.role];
  const collapsed = useUiStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    void useUiStore.persist.rehydrate();
  }, []);

  const primary = items.filter((item) => item.primary).slice(0, 4);
  const overflow = items.filter((item) => !primary.includes(item));
  const overflowCount = overflow.reduce((sum, item) => sum + (badges[item.href] ?? 0), 0);

  return (
    // Near-black frame in both themes; on desktop the content sits in an inset rounded panel.
    <div data-dashboard-shell="" className="flex min-h-dvh w-full lg:h-dvh lg:overflow-hidden lg:bg-sidebar">
      <aside
        className={cn(
          "hidden h-dvh shrink-0 flex-col bg-sidebar text-sidebar-foreground transition-[width] duration-200 lg:flex",
          collapsed ? "w-[5.25rem]" : "w-64",
        )}
        aria-label={`${ROLE_LABEL[user.role]} navigation`}
      >
        <div className={cn("flex h-20 items-center px-5", collapsed && "justify-center px-0")}>
          {collapsed ? (
            <Link href={PUBLIC_HOME} aria-label="Carrivo home page" className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring">
              <LogoMark className="size-9" />
            </Link>
          ) : (
            <Logo href={PUBLIC_HOME} tone="inverse" />
          )}
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
          <p className={cn("px-4 pb-2 text-xs font-semibold text-sidebar-muted", collapsed && "sr-only")}>{SIDEBAR_HEADINGS[user.role]}</p>
          <WithActiveHref items={items}>
            {(activeHref) => (
              <ul className="space-y-1">
                {items.map((item) => (
                  <li key={item.href}>
                    <SidebarLink item={item} active={item.href === activeHref} collapsed={collapsed} count={badges[item.href]} />
                  </li>
                ))}
              </ul>
            )}
          </WithActiveHref>
        </nav>

        <div className={cn("space-y-1 border-t border-sidebar-border p-3", collapsed && "flex flex-col items-center")}>
          <AccountActions collapsed={collapsed} />
          <Button
            variant="ghost"
            onClick={toggleSidebar}
            className={cn(
              "h-11 w-full justify-start gap-3 rounded-full px-4 text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-sidebar-ring dark:hover:bg-sidebar-accent",
              collapsed && "w-11 justify-center px-0",
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen className="size-5" /> : <PanelLeftClose className="size-5" />}
            <span className={cn(collapsed && "sr-only")}>Collapse</span>
          </Button>
        </div>
      </aside>

      {/* Content panel: full-bleed on mobile, inset with a 28px radius on desktop. It scrolls on its own. */}
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-background lg:my-3 lg:mr-3 lg:overflow-hidden lg:rounded-panel lg:shadow-overlay">
        <div className="relative flex min-h-0 flex-1 flex-col lg:overflow-y-auto lg:overscroll-contain lg:[scrollbar-gutter:stable]">
          <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-md sm:px-6 lg:h-[4.5rem] lg:border-transparent lg:px-8">
            <div className="lg:hidden">
              <Logo href={PUBLIC_HOME} showWordmark={false} />
            </div>
            <p className="truncate text-sm font-semibold text-muted-foreground">
              {ROLE_LABEL[user.role]} {user.role === "ADMIN" ? "console" : "account"}
            </p>
            <div className="ml-auto flex items-center gap-1 sm:gap-2">
              {headerActions}
              <ThemeToggle />
              <UserMenu user={user} />
            </div>
          </header>

          <main id="main" className="mx-auto w-full max-w-7xl min-w-0 flex-1 px-4 pt-6 pb-28 sm:px-6 lg:px-8 lg:pt-4 lg:pb-12">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <nav
        aria-label={`${ROLE_LABEL[user.role]} navigation`}
        className="fixed inset-x-0 bottom-0 z-40 bg-sidebar pb-[env(safe-area-inset-bottom)] text-sidebar-foreground lg:hidden"
      >
        <WithActiveHref items={items}>
          {(activeHref) => {
            const overflowActive = overflow.some((item) => item.href === activeHref);
            return (
              <ul className="mx-auto flex max-w-lg gap-1 px-2 py-2">
                {primary.map((item) => {
                  const active = item.href === activeHref;
                  const count = badges[item.href];
                  return (
                    <li key={item.href} className="flex-1">
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "relative flex h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[0.6875rem] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                          active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-muted",
                        )}
                      >
                        <item.icon className={cn("size-5", active && "text-sidebar-primary")} aria-hidden="true" />
                        <span className="max-w-full truncate px-1">{item.title}</span>
                        {count ? <CountBadge count={count} className="absolute top-1 right-[calc(50%-1.5rem)]" /> : null}
                      </Link>
                    </li>
                  );
                })}
                {overflow.length > 0 ? (
                  <li className="flex-1">
                    <button
                      type="button"
                      onClick={() => setMoreOpen(true)}
                      data-more-trigger=""
                      aria-haspopup="dialog"
                      className={cn(
                        "relative flex h-14 w-full flex-col items-center justify-center gap-1 rounded-2xl text-[0.6875rem] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                        overflowActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-muted",
                      )}
                    >
                      <Ellipsis className={cn("size-5", overflowActive && "text-sidebar-primary")} aria-hidden="true" />
                      More
                      {overflowCount ? <CountBadge count={overflowCount} className="absolute top-1 right-[calc(50%-1.5rem)]" /> : null}
                    </button>
                  </li>
                ) : null}
              </ul>
            );
          }}
        </WithActiveHref>
      </nav>

      {overflow.length > 0 ? (
        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetContent side="bottom" className="rounded-t-[1.75rem] border-sidebar-border bg-sidebar text-sidebar-foreground lg:hidden">
            <SheetHeader>
              <SheetTitle className="font-display text-sidebar-foreground">More</SheetTitle>
              <SheetDescription className="text-sidebar-muted">Other {ROLE_LABEL[user.role].toLowerCase()} pages</SheetDescription>
            </SheetHeader>
            <WithActiveHref items={items}>
              {(activeHref) => (
                <ul className="space-y-1 px-3 pb-3">
                  {overflow.map((item) => (
                    <li key={item.href}>
                      <SidebarLink
                        item={item}
                        active={item.href === activeHref}
                        collapsed={false}
                        count={badges[item.href]}
                        onNavigate={() => setMoreOpen(false)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </WithActiveHref>
            <div className="space-y-1 border-t border-sidebar-border px-3 pt-3 pb-6">
              <AccountActions collapsed={false} onNavigate={() => setMoreOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
      ) : null}
    </div>
  );
}
