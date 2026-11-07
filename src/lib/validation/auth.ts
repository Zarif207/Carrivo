import { z } from "zod";
import { ROLES } from "@/types";

/*
 * Mirrors the API's auth validation (docs/API_CONTRACT.md §3.1-3.2):
 * name 2-100, email (trimmed, lower-cased), password 8-128 on register, phone 7-20 digits with
 * optional +, spaces or dashes. Strict objects: unknown keys (e.g. `role`) are rejected.
 */

const email = z.email("Enter a valid email address").trim().toLowerCase();
const phone = z
  .string()
  .trim()
  .regex(/^\+?[0-9\s-]{7,20}$/, "Phone must be 7-20 digits, optionally with +, spaces or dashes");
const next = z.string().max(512).optional();

export const loginSchema = z.strictObject({
  email,
  password: z.string().min(1, "Enter your password"),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const registerFormSchema = z
  .strictObject({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name can be at most 100 characters"),
    email,
    phone: z.union([z.literal(""), phone]).optional(),
    password: z.string().min(8, "Password must be at least 8 characters").max(128, "Password can be at most 128 characters"),
    confirmPassword: z.string().min(1, "Type the password again"),
  })
  .refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords don't match" });
export type RegisterFormValues = z.infer<typeof registerFormSchema>;

/* Route-handler bodies (what the browser sends to /api/auth/*). */

export const loginBodySchema = loginSchema.extend({ next });

export const registerBodySchema = z.strictObject({
  name: z.string().trim().min(2).max(100),
  email,
  password: z.string().min(8).max(128),
  phone: phone.optional(),
  next,
});

export const demoBodySchema = z.strictObject({
  role: z.enum(ROLES, { error: "Choose Admin, Courier or Customer" }),
  next,
});
export type DemoRole = z.infer<typeof demoBodySchema>["role"];
