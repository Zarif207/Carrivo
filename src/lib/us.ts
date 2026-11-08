/*
 * US formats, mirroring the API's validation (docs/API_CONTRACT.md §1). Plain module with no imports,
 * so it runs in the browser, on the server and under `node --test`.
 */

/** North American number, optional +1 and common separators. Area code and exchange can't start with 0 or 1. */
export const US_PHONE_PATTERN = /^(?:\+?1[\s.-]?)?(?:\([2-9]\d{2}\)|[2-9]\d{2})[\s.-]?[2-9]\d{2}[\s.-]?\d{4}$/;
export const US_PHONE_MESSAGE = "Enter a US phone number, e.g. (212) 555-0142 or +1 212-555-0142";
export const US_PHONE_PLACEHOLDER = "(212) 555-0142";

export const ZIP_PATTERN = /^\d{5}(?:-\d{4})?$/;
export const ZIP_MESSAGE = "Enter a 5-digit ZIP code, or ZIP+4 (e.g. 10118 or 10118-0110)";

/** The API's city rule: starts with a letter; letters, spaces, periods, apostrophes and hyphens. */
export const CITY_PATTERN = /^[A-Za-z][A-Za-z .'-]*$/;

/** USPS codes for the 50 states and DC, with names for the state select. */
export const US_STATES = [
  ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"], ["CA", "California"],
  ["CO", "Colorado"], ["CT", "Connecticut"], ["DE", "Delaware"], ["DC", "District of Columbia"], ["FL", "Florida"],
  ["GA", "Georgia"], ["HI", "Hawaii"], ["ID", "Idaho"], ["IL", "Illinois"], ["IN", "Indiana"],
  ["IA", "Iowa"], ["KS", "Kansas"], ["KY", "Kentucky"], ["LA", "Louisiana"], ["ME", "Maine"],
  ["MD", "Maryland"], ["MA", "Massachusetts"], ["MI", "Michigan"], ["MN", "Minnesota"], ["MS", "Mississippi"],
  ["MO", "Missouri"], ["MT", "Montana"], ["NE", "Nebraska"], ["NV", "Nevada"], ["NH", "New Hampshire"],
  ["NJ", "New Jersey"], ["NM", "New Mexico"], ["NY", "New York"], ["NC", "North Carolina"], ["ND", "North Dakota"],
  ["OH", "Ohio"], ["OK", "Oklahoma"], ["OR", "Oregon"], ["PA", "Pennsylvania"], ["RI", "Rhode Island"],
  ["SC", "South Carolina"], ["SD", "South Dakota"], ["TN", "Tennessee"], ["TX", "Texas"], ["UT", "Utah"],
  ["VT", "Vermont"], ["VA", "Virginia"], ["WA", "Washington"], ["WV", "West Virginia"], ["WI", "Wisconsin"],
  ["WY", "Wyoming"],
] as const satisfies readonly (readonly [string, string])[];

export type UsStateCode = (typeof US_STATES)[number][0];

export const US_STATE_CODES: readonly UsStateCode[] = US_STATES.map(([code]) => code);

export const isUsStateCode = (value: string): value is UsStateCode => (US_STATE_CODES as readonly string[]).includes(value);

export interface UsAddressParts {
  street: string;
  city: string;
  state: string;
  zip: string;
}

export const EMPTY_US_ADDRESS: UsAddressParts = { street: "", city: "", state: "", zip: "" };

/** The single line the API stores: "350 5th Ave, New York, NY 10118". */
export function formatUsAddress(parts: UsAddressParts): string {
  return `${parts.street.trim()}, ${parts.city.trim()}, ${parts.state.trim().toUpperCase()} ${parts.zip.trim()}`;
}

const ADDRESS_LINE = /^(.+?),\s*([A-Za-z][A-Za-z .'-]*?)\s*,\s*([A-Za-z]{2})\s+(\d{5}(?:-\d{4})?)$/;

/**
 * Splits an API address line back into its fields (for edit forms). A line that isn't in the US
 * format (e.g. old data) comes back whole in `street`, with the other fields empty to fill in.
 */
export function parseUsAddress(line: string | null | undefined): UsAddressParts {
  const value = (line ?? "").trim();
  const match = ADDRESS_LINE.exec(value);
  if (!match) return { ...EMPTY_US_ADDRESS, street: value };
  const [, street, city, state, zip] = match;
  const code = state.toUpperCase();
  if (!isUsStateCode(code)) return { ...EMPTY_US_ADDRESS, street: value };
  return { street: street.trim(), city: city.trim(), state: code, zip };
}

/** Same acceptance rule as the API for a whole line. */
export function isValidUsAddressLine(line: string): boolean {
  const value = line.trim();
  if (value.length < 5 || value.length > 300) return false;
  const parts = parseUsAddress(value);
  return parts.city !== "" && parts.street.length >= 3;
}
