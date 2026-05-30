/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Auth — Zod Validation Schemas
   All error messages are i18n keys resolved at the UI layer.
   ═══════════════════════════════════════════════════════════════════ */

import { z } from "zod";

/* ── Sign In Schema ─────────────────────────────────────────────── */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: "auth.errors.invalidEmail" })
    .email({ message: "auth.errors.invalidEmail" }),
  password: z
    .string()
    .min(8, { message: "auth.errors.passwordTooShort" }),
});

export type LoginInput = z.infer<typeof loginSchema>;

/* ── Sign Up Schema ─────────────────────────────────────────────── */
export const signUpSchema = z
  .object({
    name: z
      .string()
      .min(2, { message: "auth.errors.nameTooShort" })
      .max(60, { message: "auth.errors.nameTooShort" }),
    email: z
      .string()
      .min(1, { message: "auth.errors.invalidEmail" })
      .email({ message: "auth.errors.invalidEmail" }),
    password: z
      .string()
      .min(8, { message: "auth.errors.passwordTooShort" })
      .regex(/[A-Z]/, { message: "auth.errors.passwordUppercase" })
      .regex(/[0-9]/, { message: "auth.errors.passwordNumber" }),
    confirmPassword: z.string().min(1, {
      message: "auth.errors.passwordsDoNotMatch",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "auth.errors.passwordsDoNotMatch",
  });

export type SignUpInput = z.infer<typeof signUpSchema>;
