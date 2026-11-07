import type { ReactNode } from "react";
import { UserAvatar } from "@/components/layout/user-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/format";
import type { UserProfile } from "@/types";

/* Server-safe layout pieces shared by every role's profile page. */

export function ProfilePanel({ title, description, children }: { title: string; description: ReactNode; children: ReactNode }) {
  return (
    <section className="grid gap-6 rounded-xl bg-card p-6 shadow-card lg:grid-cols-[16rem_1fr] lg:gap-10 lg:p-8">
      <div className="space-y-1">
        <h2 className="text-lg font-bold">{title}</h2>
        <div className="text-sm text-muted-foreground">{description}</div>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

export function ProfileSummary({ profile, since }: { profile: UserProfile; since: string }) {
  return (
    <div className="flex items-center gap-4 rounded-xl bg-card p-6 shadow-card">
      <UserAvatar user={profile} className="size-16 text-lg" />
      <div className="min-w-0">
        <p className="truncate text-xl font-extrabold tracking-tight">{profile.name}</p>
        <p className="truncate text-muted-foreground">{profile.email}</p>
        <p className="text-sm text-muted-foreground">
          {since} since {formatDate(profile.createdAt)}
        </p>
      </div>
    </div>
  );
}

export function ProfileSkeleton({ panels = 2 }: { panels?: number }) {
  return (
    <div className="space-y-6" aria-busy="true">
      <Skeleton className="h-28 rounded-xl" />
      {Array.from({ length: panels }, (_, i) => (
        <Skeleton key={i} className="h-72 rounded-xl" />
      ))}
    </div>
  );
}
