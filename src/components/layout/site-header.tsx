"use client";

// Client: the mobile menu sheet (open state) and active-link highlighting (usePathname).
import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState } from "react";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { PUBLIC_NAV } from "@/config/nav";
import { cn } from "@/lib/utils";

const isActive = (pathname: string | null, href: string) => pathname !== null && (pathname === href || pathname.startsWith(`${href}/`));

const LINK_STYLES = {
  desktop:
    "rounded-full px-3.5 py-2 text-sm font-semibold text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 aria-[current=page]:bg-card aria-[current=page]:text-foreground aria-[current=page]:shadow-card",
  mobile:
    "flex h-12 items-center rounded-full px-4 text-base font-semibold outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 aria-[current=page]:bg-secondary",
} as const;

interface NavListProps {
  variant: keyof typeof LINK_STYLES;
  pathname: string | null;
  onNavigate?: () => void;
}

function NavList({ variant, pathname, onNavigate }: NavListProps) {
  return (
    <ul className={variant === "desktop" ? "flex items-center gap-1" : "space-y-1"}>
      {PUBLIC_NAV.map((item) => (
        <li key={item.href}>
          <Link href={item.href} onClick={onNavigate} aria-current={isActive(pathname, item.href) ? "page" : undefined} className={LINK_STYLES[variant]}>
            {item.title}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function ActiveNavList(props: Omit<NavListProps, "pathname">) {
  return <NavList {...props} pathname={usePathname()} />;
}

/**
 * The pathname is request data on dynamic routes (Cache Components), so the highlighted list
 * streams in under <Suspense>; the fallback is the same list without highlighting (no layout shift).
 */
function Nav(props: Omit<NavListProps, "pathname">) {
  return (
    <Suspense fallback={<NavList {...props} pathname={null} />}>
      <ActiveNavList {...props} />
    </Suspense>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Logo />

        <nav aria-label="Main" className={cn("hidden lg:block")}>
          <Nav variant="desktop" />
        </nav>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild className="hidden sm:inline-flex">
            <Link href="/register">Send a parcel</Link>
          </Button>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(22rem,88vw)] gap-0 p-0">
              <SheetHeader className="border-b border-border p-5">
                <SheetTitle asChild>
                  <div>
                    <Logo href={null} />
                  </div>
                </SheetTitle>
                <SheetDescription className="sr-only">Site navigation</SheetDescription>
              </SheetHeader>
              <nav aria-label="Mobile" className="flex-1 overflow-y-auto p-3">
                <Nav variant="mobile" onNavigate={() => setOpen(false)} />
              </nav>
              <div className="grid gap-2 border-t border-border p-4">
                <Button asChild size="lg">
                  <Link href="/register" onClick={() => setOpen(false)}>
                    Send a parcel
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/login" onClick={() => setOpen(false)}>
                    Log in
                  </Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
