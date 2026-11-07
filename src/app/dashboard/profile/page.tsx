import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { PasswordForm } from "@/components/profile/password-form";
import { ProfileForm } from "@/components/profile/profile-form";
import { UserAvatar } from "@/components/layout/user-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUser } from "@/lib/auth/current-user";
import { formatDate } from "@/lib/format";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Profile", robots: { index: false } };

function Panel({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="grid gap-6 rounded-xl bg-card p-6 shadow-card lg:grid-cols-[16rem_1fr] lg:gap-10 lg:p-8">
      <div className="space-y-1">
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

/** The verified profile (same request-cached lookup the layout used). Request-time: under Suspense. */
async function ProfileContent() {
  const current = await getCurrentUser();
  if (!current) redirect("/api/auth/session-expired?reason=expired");
  const profile = current.user;
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 rounded-xl bg-card p-6 shadow-card">
        <UserAvatar user={profile} className="size-16 text-lg" />
        <div className="min-w-0">
          <p className="truncate text-xl font-extrabold tracking-tight">{profile.name}</p>
          <p className="truncate text-muted-foreground">{profile.email}</p>
          <p className="text-sm text-muted-foreground">Customer since {formatDate(profile.createdAt)}</p>
        </div>
      </div>
      <Panel title="Your details" description="Your name and phone appear on shipments you send. Your address fills in the pickup address.">
        <ProfileForm profile={profile} />
      </Panel>
      <Panel title="Password" description="If you signed up with Google, you don't have a password to change here.">
        <PasswordForm email={profile.email} />
      </Panel>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <Skeleton className="h-28 rounded-xl" />
      <Skeleton className="h-80 rounded-xl" />
      <Skeleton className="h-72 rounded-xl" />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <>
      <PageHeader title="Profile" description="Your contact details and password." />
      <Suspense fallback={<ProfileSkeleton />}>
        <ProfileContent />
      </Suspense>
    </>
  );
}
