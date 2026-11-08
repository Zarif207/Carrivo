import { z } from "zod";
import { usPhone } from "./us";

/*
 * Mirrors the API's auth validation (docs/API_CONTRACT.md §3.1-3.2):
 * name 2-100, email (trimmed, lower-cased), password 8-128 on register, an optional US phone.
 * Strict objects: unknown keys (e.g. `role`) are rejected.
 */

const email = z.email("Enter a valid email address").trim().toLowerCase();
const phone = usPhone;
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

/**
 * The only accounts the one-click demo may sign in as. ADMIN is deliberately absent: the real admin
 * signs in with the normal form; the demo "Admin" is the read-only ADMIN_VIEWER.
 */
export const DEMO_ROLES = ["CUSTOMER", "COURIER", "ADMIN_VIEWER"] as const;

export const demoBodySchema = z.strictObject({
  role: z.enum(DEMO_ROLES, { error: "Choose Customer, Courier or Admin (view-only)" }),
  next,
});
export type DemoRole = z.infer<typeof demoBodySchema>["role"];
