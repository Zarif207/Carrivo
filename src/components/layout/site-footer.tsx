import Link from "next/link";
import { Logo } from "@/components/shared/logo";

const COLUMNS: { title: string; links: { title: string; href: string }[] }[] = [
  {
    title: "Ship",
    links: [
      { title: "Track a parcel", href: "/track" },
      { title: "Get a price", href: "/pricing" },
      { title: "Services", href: "/services" },
    ],
  },
  {
    title: "Company",
    links: [
      { title: "About Carrivo", href: "/about" },
      { title: "Contact us", href: "/contact" },
    ],
  },
  {
    title: "Account",
    links: [
      { title: "Log in", href: "/login" },
      { title: "Create an account", href: "/register" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-sidebar text-sidebar-foreground">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_2fr] lg:px-8">
        <div className="max-w-sm space-y-4">
          <Logo tone="inverse" />
          <p className="text-sidebar-muted">
            Book a courier, pay online and follow your parcel from pickup to the receiver&rsquo;s door.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {COLUMNS.map((column) => (
            <div key={column.title} className="space-y-3">
              <h2 className="font-display text-base">{column.title}</h2>
              <ul className="space-y-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="rounded text-sidebar-muted outline-none hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring"
                    >
                      {link.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-sidebar-border">
        <p className="mx-auto w-full max-w-7xl px-4 py-5 text-sm text-sidebar-muted sm:px-6 lg:px-8">
          &copy; 2026 Carrivo. Payments are processed by Stripe.
        </p>
      </div>
    </footer>
  );
}
