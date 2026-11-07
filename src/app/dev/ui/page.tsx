import Link from "next/link";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Gallery } from "./gallery";

export const metadata = { title: "UI check", robots: { index: false } };

function GallerySkeleton() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-10 w-1/2" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

/** TEMPORARY: every shared component, rendered once in light and once in dark. */
export default function DevUiPage() {
  return (
    <div className="flex-1">
      <div className="border-b border-border px-4 py-4 sm:px-6">
        <p className="text-sm text-muted-foreground">
          Temporary component check (removed before submission). Shells:{" "}
          <Link className="font-semibold underline" href="/dev/ui/shell/customer">customer</Link>,{" "}
          <Link className="font-semibold underline" href="/dev/ui/shell/courier">courier</Link>,{" "}
          <Link className="font-semibold underline" href="/dev/ui/shell/admin">admin</Link>.
        </p>
      </div>
      <div className="grid xl:grid-cols-2">
        {(["light", "dark"] as const).map((theme) => (
          <section key={theme} className={`${theme} min-w-0`} aria-label={`${theme} theme`}>
            <Suspense fallback={<GallerySkeleton />}>
              <Gallery theme={theme} />
            </Suspense>
          </section>
        ))}
      </div>
    </div>
  );
}
