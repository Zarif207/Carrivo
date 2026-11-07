import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthNotice } from "@/components/auth/auth-notice";
import { GoogleButton } from "@/components/auth/google-button";
import { RegisterForm } from "@/components/auth/register-form";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { safeNextPath } from "@/lib/auth/redirects";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Create a free Carrivo account to book couriers, pay online and track every parcel.",
  alternates: { canonical: "/register" },
  openGraph: { title: "Create a Carrivo account", url: "/register" },
};

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

async function RegisterContent({ searchParams }: { searchParams: PageProps<"/register">["searchParams"] }) {
  const params = await searchParams;
  const next = safeNextPath(first(params.next));
  const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : "/login";

  return (
    <div className="space-y-6">
      <AuthNotice error={first(params.error)} />
      <div className="space-y-6 rounded-2xl bg-card p-6 shadow-card sm:p-8">
        <RegisterForm next={next} />
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Separator className="flex-1" />
          or
          <Separator className="flex-1" />
        </div>
        <GoogleButton next={next} label="Sign up with Google" />
      </div>
      <p className="text-center text-muted-foreground">
        Already have an account?{" "}
        <Link href={loginHref} className="font-semibold text-brand-text underline-offset-4 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage({ searchParams }: PageProps<"/register">) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-display text-display-2">Create your account</h1>
        <p className="text-lg text-muted-foreground">Free to join. Pay only for the parcels you send.</p>
      </div>
      <Suspense
        fallback={
          <div className="space-y-5 rounded-2xl bg-card p-6 shadow-card sm:p-8" aria-hidden="true">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
            <Skeleton className="h-12 rounded-full" />
          </div>
        }
      >
        <RegisterContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
