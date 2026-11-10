import { Eye } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { PasswordForm } from "@/components/profile/password-form";
import { ProfileForm } from "@/components/profile/profile-form";
import { ProfilePanel, ProfileSkeleton, ProfileSummary } from "@/components/profile/profile-sections";
import { PageHeader } from "@/components/shared/page-header";
import { DetailRows, PhoneLink } from "@/components/shipments/detail-parts";
import { ROLE_LABEL } from "@/config/nav";
import { getCurrentUser } from "@/lib/auth/current-user";
import { canMutate } from "@/lib/auth/permissions";

export const metadata: Metadata = { title: "Profile", robots: { index: false } };

/**
 * The verified profile (same request-cached lookup the layout used). Request-time: under Suspense.
 * The role comes from the API, so a viewer never gets the edit controls, not even for a moment;
 * the BFF and the API refuse a viewer's PATCH /users/me and change-password anyway.
 */
async function ProfileContent() {
  const current = await getCurrentUser();
  if (!current) redirect("/api/auth/session-expired?reason=expired");
  const profile = current.user;

  if (!canMutate(profile.role)) {
    return (
      <div className="space-y-6">
        <ProfileSummary profile={profile} since={ROLE_LABEL[profile.role]} />
        <ProfilePanel
          title="Your details"
          description={
            <span className="flex items-start gap-2">
              <Eye className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>View-only access: this account can&rsquo;t change its details or password. Ask an admin if something here is wrong.</span>
            </span>
          }
        >
          <DetailRows
            rows={[
              ["Name", profile.name],
              ["Email", profile.email],
              ["Phone", profile.phone ? <PhoneLink key="p" phone={profile.phone} /> : "Not set"],
              ["Role", ROLE_LABEL[profile.role]],
            ]}
          />
        </ProfilePanel>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ProfileSummary profile={profile} since={ROLE_LABEL[profile.role]} />
      <ProfilePanel title="Your details" description="Your name appears in the audit log next to the changes you make.">
        <ProfileForm profile={profile} withAddress={false} />
      </ProfilePanel>
      <ProfilePanel title="Password" description="Use at least 8 characters. Admin accounts can change everything, so use a long, unique password.">
        <PasswordForm email={profile.email} />
      </ProfilePanel>
    </div>
  );
}

export default function AdminProfilePage() {
  return (
    <>
      <PageHeader title="Profile" description="Your account details and password." />
      <Suspense fallback={<ProfileSkeleton />}>
        <ProfileContent />
      </Suspense>
    </>
  );
}
