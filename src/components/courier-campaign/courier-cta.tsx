import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { SIGNED_OUT_CTA, type CourierCta as CourierCtaModel } from "@/lib/courier-cta";
import { getCourierCta } from "@/lib/data/courier-cta";
import { cn } from "@/lib/utils";

/*
 * The one "Become a courier" button of the courier campaign (home section, /drive-with-carrivo and its
 * sticky mobile bar). Server component: the signed-out button is part of the static shell (so it works
 * with JavaScript off: the proxy routes a signed-in visitor on from /login), and the visitor's own
 * version streams into the same box. Both have the same size, so the swap never shifts the layout.
 */

type Tone = "page" | "ink" | "brand";

interface CourierCtaProps {
  /** What it sits on: the page, the ink band, or an orange panel. */
  tone?: Tone;
  /** "stack": button row with the note under it. "bar": the compact sticky mobile bar. */
  variant?: "stack" | "bar";
  /** A second button beside the primary one (stack only), e.g. "Learn more". */
  secondary?: ReactNode;
  className?: string;
}

const NOTE_TONE: Record<Tone, string> = {
  page: "text-muted-foreground",
  ink: "text-sidebar-muted",
  brand: "text-brand-foreground",
};

const BUTTON_TONE: Record<Tone, string | undefined> = {
  page: undefined,
  ink: undefined,
  brand: "bg-ink text-ink-foreground hover:bg-ink/90",
};

export function CourierCtaView({ cta, tone = "page", variant = "stack", secondary, className }: CourierCtaProps & { cta: CourierCtaModel }) {
  const button = (
    <Button asChild size={variant === "bar" ? "default" : "lg"} className={cn(variant === "bar" ? "min-w-[10.5rem]" : "w-full sm:w-auto sm:min-w-[13.5rem]", BUTTON_TONE[tone])}>
      <Link href={cta.href} data-courier-cta={cta.kind}>
        {cta.label} <ArrowRight aria-hidden="true" />
      </Link>
    </Button>
  );

  if (variant === "bar") {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <p className={cn("line-clamp-2 min-w-0 flex-1 text-sm leading-5", NOTE_TONE[tone])}>{cta.note}</p>
        {button}
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        {button}
        {secondary}
      </div>
      {/* Two lines reserved on phones, one from sm: every version of the note fits without a shift. */}
      <p className={cn("min-h-10 text-sm leading-5 sm:min-h-5", NOTE_TONE[tone])}>{cta.note}</p>
    </div>
  );
}

async function ResolvedCourierCta(props: CourierCtaProps) {
  return <CourierCtaView {...props} cta={await getCourierCta()} />;
}

export function CourierCta(props: CourierCtaProps) {
  return (
    <Suspense fallback={<CourierCtaView {...props} cta={SIGNED_OUT_CTA} />}>
      <ResolvedCourierCta {...props} />
    </Suspense>
  );
}
