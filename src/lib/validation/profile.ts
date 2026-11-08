import { z } from "zod";
import { optionalUsAddress, optionalUsPhone } from "./us";

/* PATCH /users/me (contract §5): name 2-100, US phone | null, US address | null, image URL | null. */

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name can be at most 100 characters"),
  phone: optionalUsPhone,
  /** Street, city, state and ZIP (all empty = no address); sent as one line. */
  address: optionalUsAddress,
  image: z.union([z.literal(""), z.url("Enter a full link starting with https://")]),
});
export type ProfileValues = z.infer<typeof profileSchema>;

export const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z.string().min(8, "Password must be at least 8 characters").max(128, "Password can be at most 128 characters"),
    confirmPassword: z.string().min(1, "Type the new password again"),
    revokeOtherSessions: z.boolean(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords don't match" })
  .refine((v) => v.newPassword !== v.currentPassword, { path: ["newPassword"], message: "Choose a password you haven't used here" });
export type PasswordValues = z.infer<typeof passwordSchema>;
