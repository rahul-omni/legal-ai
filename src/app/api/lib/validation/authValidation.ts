import { z } from "zod";

export const individualSignupSchema = z.object({
  name: z
    .string()
    .min(1)
    .optional()
    .transform((val) => val?.trim().toLowerCase()),
  email: z
    .string()
    .email()
    .transform((val) => val.toLowerCase()),
  password: z.string().min(8),
  roleId: z.string().uuid().optional(),
});

export const organizationSignupSchema = z.object({
  orgName: z
    .string()
    .min(1)
    .transform((val) => val.trim().toLowerCase()),
  adminName: z
    .string()
    .min(1)
    .transform((val) => val.trim().toLowerCase()),
  email: z
    .string()
    .email()
    .transform((val) => val.trim().toLowerCase()),
  password: z.string().min(8),
  roleId: z.string().uuid().optional(),
});

export const logInSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .min(1, "Email is required")
    .email("Invalid email"),
  password: z
    .string({ required_error: "Password is required" })
    .min(1, "Password is required")
    .min(8, "Password must be more than 8 characters")
    .max(32, "Password must be less than 32 characters"),
});
