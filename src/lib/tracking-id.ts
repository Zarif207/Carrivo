/** Tracking id rules without Zod, so the hero's tracking form doesn't ship Zod in the first load. */

/** CRV-YYMMDD-XXXXXX, case-insensitive (the API upper-cases on lookup). */
export const TRACKING_ID_PATTERN = /^CRV-\d{6}-[A-Z0-9]{6}$/i;

export const normalizeTrackingId = (value: string): string => value.trim().toUpperCase();
