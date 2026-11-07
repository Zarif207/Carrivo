import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AvailabilityToggle } from "@/components/courier/availability-toggle";
import { PasswordForm } from "@/components/profile/password-form";
import { ProfileForm } from "@/components/profile/profile-form";
import { ProfilePanel, ProfileSkeleton, ProfileSummary } from "@/components/profile/profile-sections";
import { PageHeader } from "@/components/shared/page-header";
import { DetailRows } from "@/components/shipments/detail-parts";
import { getCurrentUser } from "@/lib/auth/current-user";
import { VEHICLE_NAMES } from "@/lib/status";

export const metadata: Metadata = { title: "Profile", robots: { index: false } };

/** The verified profile (same request-cached lookup the layout used). Request-time: under Suspense. */
async function ProfileContent() {
  const current = await getCurrentUser();
  if (!current) redirect("/api/auth/session-expired?reason=expired");
  const profile = current.user;
  const courier = profile.courierProfile;
  return (
    <div className="space-y-6">
      <ProfileSummary profile={profile} since="Courier" />
      {courier ? (
        <>
          <ProfilePanel title="Availability" description="Pause when you're off shift. It only affects new assignments.">
            <AvailabilityToggle initial={courier.isAvailable} />
          </ProfilePanel>
          <ProfilePanel title="Vehicle and area" description="Set by the Carrivo team. Ask an admin if something here is wrong.">
            <DetailRows
              rows={[
                ["Vehicle", VEHICLE_NAMES[courier.vehicleType]],
                ["Number plate", courier.vehicleNumber ? <span key="v" className="font-id">{courier.vehicleNumber}</span> : "Not set"],
                ["Zone", courier.zone.name],
                ["Hub", courier.hub ? (courier.hub.city ? `${courier.hub.name}, ${courier.hub.city}` : courier.hub.name) : "Not assigned"],
              ]}
            />
          </ProfilePanel>
        </>
      ) : null}
      <ProfilePanel title="Your details" description="Customers see your name and phone on the shipments you carry.">
        <ProfileForm profile={profile} />
      </ProfilePanel>
      <ProfilePanel title="Password" description="Use at least 8 characters.">
        <PasswordForm email={profile.email} />
      </ProfilePanel>
    </div>
  );
}

export default function CourierProfilePage() {
  return (
    <>
      <PageHeader title="Profile" description="Your availability, vehicle, contact details and password." />
      <Suspense fallback={<ProfileSkeleton panels={4} />}>
        <ProfileContent />
      </Suspense>
    </>
  );
}
