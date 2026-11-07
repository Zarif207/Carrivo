import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthNotice } from "@/components/auth/auth-notice";
import { DemoLogin } from "@/components/auth/demo-login";
import { GoogleButton } from "@/components/auth/google-button";
import { LoginForm } from "@/components/auth/login-form";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { safeNextPath } from "@/lib/auth/redirects";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to Carrivo to book, pay for and track your shipments.",
  alternates: { canonical: "/login" },
  openGraph: { title: "Log in to Carrivo", url: "/login" },
};

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/** Reads ?next, ?reason and ?error (request data) under Suspense. */
async function LoginContent({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const params = await searchParams;
  const next = safeNextPath(first(params.next));
  const registerHref = next ? `/register?next=${encodeURIComponent(next)}` : "/register";

  return (
    <div className="space-y-6">
      <AuthNotice reason={first(params.reason)} error={first(params.error)} />
      <div className="space-y-6 rounded-2xl bg-card p-6 shadow-card sm:p-8">
        <LoginForm next={next} />
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Separator className="flex-1" />
          or
          <Separator className="flex-1" />
        </div>
        <GoogleButton next={next} />
      </div>
      <p className="text-center text-muted-foreground">
        New to Carrivo?{" "}
        <Link href={registerHref} className="font-semibold text-brand-text underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
      <DemoLogin next={next} />
    </div>
  );
}

function LoginSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <div className="space-y-5 rounded-2xl bg-card p-6 shadow-card sm:p-8">
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
        <Skeleton className="h-12 rounded-full" />
        <Skeleton className="h-12 rounded-full" />
      </div>
      <Skeleton className="h-36 rounded-xl" />
    </div>
  );
}

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-display text-display-2">Welcome back</h1>
        <p className="text-lg text-muted-foreground">Log in to book, pay for and track your parcels.</p>
      </div>
      <Suspense fallback={<LoginSkeleton />}>
        <LoginContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
