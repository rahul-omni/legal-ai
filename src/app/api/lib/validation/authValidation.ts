import { z } from "zod";

export const IndividualSignupSchema = z.object({
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

export const OrganizationSignupSchema = z.object({
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
