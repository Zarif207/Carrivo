import type { Metadata } from "next";
import { CourierCta } from "@/components/courier-campaign/courier-cta";
import { DriveMotion } from "@/components/courier-campaign/drive-motion";
import { DriveBenefits, DriveFaq, DriveFinalCta, DriveHero, DriveRequirements, DriveTimeline } from "@/components/courier-campaign/drive-page";
import { StickyCtaBar } from "@/components/courier-campaign/sticky-cta-bar";
import { DriveZoneGrid } from "@/components/courier-campaign/zone-grid";
import { DRIVE_WITH_CARRIVO_PATH } from "@/config/nav";

const TITLE = "Drive with Carrivo";
const DESCRIPTION =
  "Deliver parcels in the US metro zone you know, on the days that suit you. Carrivo customers can apply to become couriers in about two minutes; an admin reviews every application.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: DRIVE_WITH_CARRIVO_PATH },
  openGraph: { title: `${TITLE} | Carrivo`, description: DESCRIPTION, url: DRIVE_WITH_CARRIVO_PATH },
};

/**
 * The courier recruitment page. Static apart from the role-aware buttons (CourierCta streams the
 * visitor's version into a same-size box) and the zone grid's rare request-time retry. Every button
 * leads to the one application form at /courier-application.
 */
export default function DriveWithCarrivoPage() {
  return (
    <>
      <DriveHero />
      <DriveBenefits />
      <DriveTimeline />
      <DriveZoneGrid />
      <DriveRequirements />
      <DriveFaq />
      <DriveFinalCta />
      <StickyCtaBar>
        <CourierCta variant="bar" />
      </StickyCtaBar>
      <DriveMotion />
    </>
  );
}
