import { ArrowLeft, Camera, CreditCard, Route } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";

const POINTS = [
  { icon: <Route />, text: "Follow every parcel from pickup to the door" },
  { icon: <CreditCard />, text: "See the price before you pay, by card through Stripe" },
  { icon: <Camera />, text: "Hand-over photos on your shipment page" },
];

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-1 flex-col lg:flex-row">
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between px-4 sm:px-8">
          <Logo />
          <div className="flex items-center gap-1">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <ArrowLeft className="size-4" aria-hidden="true" /> Back to site
            </Link>
            <ThemeToggle />
          </div>
        </header>
        <main id="main" className="flex flex-1 items-start justify-center px-4 pt-6 pb-16 sm:px-8 lg:items-center lg:pt-0">
          <div className="w-full max-w-xl">{children}</div>
        </main>
      </div>

      <aside className="hidden w-[38%] max-w-xl flex-col justify-between bg-ink p-12 text-ink-foreground lg:flex" aria-label="Why Carrivo">
        <Logo href={null} tone="inverse" />
        <div className="space-y-8">
          <p className="text-[2.75rem] leading-[1.05] font-extrabold tracking-tight">Door-to-door delivery, tracked at every stop.</p>
          <ul className="space-y-4">
            {POINTS.map((point) => (
              <li key={point.text} className="flex items-start gap-3 text-sidebar-muted [&_svg]:mt-0.5 [&_svg]:size-5 [&_svg]:shrink-0 [&_svg]:text-brand">
                {point.icon}
                <span className="text-ink-foreground">{point.text}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-sidebar-muted">Payments are processed by Stripe. We never see your card number.</p>
      </aside>
    </div>
  );
}
