import { DetailRows, PhoneLink, type DetailRow } from "@/components/shipments/detail-parts";
import { formatDateTime } from "@/lib/format";
import { VEHICLE_NAMES, WORK_AVAILABILITY_NAMES } from "@/lib/status";
import type { CourierApplication } from "@/types";

/** Every field an applicant filled in, as label/value rows (server-safe; used by both sides). */
export function applicationRows(application: CourierApplication): DetailRow[] {
  return [
    ["Submitted", formatDateTime(application.createdAt)],
    ["Phone", <PhoneLink key="phone" phone={application.phone} />],
    ["Preferred zone", application.preferredZone?.name ?? "No preference"],
    ["Vehicle", VEHICLE_NAMES[application.vehicleType]],
    ["Number plate", application.vehiclePlate ? <span key="plate" className="font-id">{application.vehiclePlate}</span> : "Not given"],
    ["Availability", WORK_AVAILABILITY_NAMES[application.availability]],
  ];
}

/** Free-text answers, kept readable (they can run to a few lines). */
export function ApplicationAnswers({ application }: { application: CourierApplication }) {
  const answers = [
    ["Experience", application.experience],
    ["About", application.about],
  ] as const;
  const given = answers.filter(([, value]) => value);
  if (given.length === 0) return null;
  return (
    <dl className="space-y-4">
      {given.map(([label, value]) => (
        <div key={label} className="space-y-1">
          <dt className="text-sm text-muted-foreground">{label}</dt>
          <dd className="whitespace-pre-line break-words">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ApplicationDetails({ application }: { application: CourierApplication }) {
  return (
    <div className="space-y-5">
      <DetailRows rows={applicationRows(application)} />
      <ApplicationAnswers application={application} />
    </div>
  );
}
