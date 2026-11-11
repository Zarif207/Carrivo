import { Clock, Mail } from "lucide-react";
import Link from "next/link";
import { LogoMark } from "@/components/shared/logo";
import { SITE } from "@/config/site";
import { BackToTop } from "./back-to-top";

const COLUMNS: { title: string; links: { title: string; href: string }[] }[] = [
  {
    title: "Ship",
    links: [
      { title: "Track a parcel", href: "/track" },
      { title: "Get a price", href: "/pricing" },
      { title: "Services", href: "/services" },
      { title: "Send a parcel", href: "/register" },
    ],
  },
  {
    title: "Company",
    links: [
      { title: "About Carrivo", href: "/about" },
      { title: "Drive with Carrivo", href: "/drive-with-carrivo" },
      { title: "Become a courier", href: "/courier-application" },
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

const LINK =
  "rounded text-sidebar-muted outline-none transition-colors hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring";

/** Server component: a near-black footer in both themes; only the back-to-top button is client code. */
export function SiteFooter() {
  return (
    <footer className="mt-auto overflow-hidden bg-sidebar text-sidebar-foreground">
      <div className="mx-auto w-full max-w-7xl px-4 pt-16 sm:px-6 lg:px-8 lg:pt-20">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr]">
          <div className="max-w-sm space-y-6">
            <LogoMark className="size-11" />
            <p className="text-lg text-sidebar-muted">
              Book a courier, pay online and follow your parcel from pickup to the receiver&rsquo;s door.
            </p>
            <BackToTop />
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
            {COLUMNS.map((column) => (
              <nav key={column.title} aria-label={column.title} className="space-y-4">
                <h2 className="text-sm font-bold text-sidebar-foreground">{column.title}</h2>
                <ul className="space-y-2.5">
                  {column.links.map((link) => (
                    <li key={`${column.title}-${link.href}`}>
                      <Link href={link.href} className={LINK}>
                        {link.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}

            <section aria-labelledby="footer-support" className="col-span-2 space-y-4 sm:col-span-1">
              <h2 id="footer-support" className="text-sm font-bold text-sidebar-foreground">
                Support
              </h2>
              <dl className="space-y-2.5 text-sm">
                {SITE.supportHours.map((row) => (
                  <div key={row.days}>
                    <dt className="text-sidebar-muted">{row.days}</dt>
                    <dd className="font-semibold tabular">{row.hours}</dd>
                  </div>
                ))}
              </dl>
              <p className="flex items-center gap-2 text-sm text-sidebar-muted">
                <Clock className="size-4 shrink-0" aria-hidden="true" /> {SITE.timeZoneLabel}
              </p>
              <a href={`mailto:${SITE.contactEmail}`} className={`${LINK} inline-flex items-center gap-2 text-sm`}>
                <Mail className="size-4 shrink-0" aria-hidden="true" /> {SITE.contactEmail}
              </a>
            </section>
          </div>
        </div>
      </div>

      {/* Oversized wordmark: decorative (the logo and the page title already name the brand). */}
      <div aria-hidden="true" className="mx-auto mt-16 w-full max-w-7xl px-4 select-none sm:px-6 lg:px-8">
        <svg viewBox="0 0 1000 205" className="block w-full fill-white/[0.07]" focusable="false">
          <text x="0" y="188" textLength="1000" lengthAdjust="spacingAndGlyphs" className="font-display font-extrabold" fontSize="248">
            Carrivo
          </text>
        </svg>
      </div>

      <div className="border-t border-sidebar-border">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-sidebar-muted sm:flex-row sm:justify-between sm:px-6 lg:px-8">
          <p>&copy; 2026 Carrivo. Card payments are processed by Stripe.</p>
          <p>Prices in US dollars, weights in pounds.</p>
        </div>
      </div>
    </footer>
  );
}
