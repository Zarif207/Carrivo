import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { PasswordForm } from "@/components/profile/password-form";
import { ProfileForm } from "@/components/profile/profile-form";
import { ProfilePanel, ProfileSkeleton, ProfileSummary } from "@/components/profile/profile-sections";
import { getCurrentUser } from "@/lib/auth/current-user";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Profile", robots: { index: false } };

/** The verified profile (same request-cached lookup the layout used). Request-time: under Suspense. */
async function ProfileContent() {
  const current = await getCurrentUser();
  if (!current) redirect("/api/auth/session-expired?reason=expired");
  const profile = current.user;
  return (
    <div className="space-y-6">
      <ProfileSummary profile={profile} since="Customer" />
      <ProfilePanel title="Your details" description="Your name and phone appear on shipments you send. Your address fills in the pickup address.">
        <ProfileForm profile={profile} />
      </ProfilePanel>
      <ProfilePanel title="Password" description="If you signed up with Google, you don't have a password to change here.">
        <PasswordForm email={profile.email} />
      </ProfilePanel>
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
