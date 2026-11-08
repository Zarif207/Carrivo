import { z } from "zod";
import { CITY_PATTERN, US_PHONE_MESSAGE, US_PHONE_PATTERN, ZIP_MESSAGE, ZIP_PATTERN, formatUsAddress, isUsStateCode, type UsAddressParts } from "@/lib/us";

/* US phone and address rules shared by every form. They mirror the API (docs/API_CONTRACT.md §1). */

export const usPhone = z.string().trim().regex(US_PHONE_PATTERN, US_PHONE_MESSAGE);

/** Optional phone: empty, or a valid US number. */
export const optionalUsPhone = z.union([z.literal(""), usPhone]);

const addressFields = {
  street: z.string().trim().min(3, "Enter the street address").max(200, "Keep the street under 200 characters"),
  city: z
    .string()
    .trim()
    .min(2, "Enter the city")
    .max(80, "Keep the city under 80 characters")
    .regex(CITY_PATTERN, "Use letters, spaces, periods, apostrophes or hyphens"),
  state: z.string().refine((value): boolean => isUsStateCode(value), "Choose a state"),
  zip: z.string().trim().regex(ZIP_PATTERN, ZIP_MESSAGE),
};

const fitsOneLine = (v: UsAddressParts) => formatUsAddress(v).length <= 300;

/** Street, city, state and ZIP; the API receives them joined as "street, City, ST 12345". */
export const usAddress = z
  .object(addressFields)
  .refine(fitsOneLine, { path: ["street"], message: "The whole address must be under 300 characters" });

/** Optional address: all four fields empty, or a complete US address. */
export const optionalUsAddress = z
  .object({ street: z.string(), city: z.string(), state: z.string(), zip: z.string() })
  .superRefine((value, ctx) => {
    if (!value.street.trim() && !value.city.trim() && !value.state && !value.zip.trim()) return;
    const result = usAddress.safeParse(value);
    if (result.success) return;
    for (const issue of result.error.issues) ctx.addIssue({ code: "custom", path: issue.path, message: issue.message });
  });

export const isEmptyAddress = (value: UsAddressParts) => !value.street.trim() && !value.city.trim() && !value.state && !value.zip.trim();
