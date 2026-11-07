/** Public site facts in one place. Contact details are content the owner should confirm before launch. */
export const SITE = {
  name: "Carrivo",
  url: (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/+$/, ""),
  description: "Book a courier, pay online and follow every parcel from pickup to the receiver's door.",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "support@carrivo.dev",
  /** Support hours in the business timezone (the API's dates are Dhaka time). */
  supportHours: [
    { days: "Saturday to Thursday", hours: "9:00 am to 9:00 pm" },
    { days: "Friday", hours: "3:00 pm to 9:00 pm" },
  ],
  timeZoneLabel: "Dhaka time (GMT+6)",
} as const;

/** The seeded demo parcel; shown as an example only when it really exists in the data. */
export const EXAMPLE_TRACKING_ID = "CRV-261101-SEED05";
