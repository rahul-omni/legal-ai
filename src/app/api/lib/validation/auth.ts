import { z } from "zod";
import { OrganizationSignupRequest } from "../../auth/types";

export const IndividualSignupSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email(),
  password: z.string().min(8),
  roleId: z.string().uuid().optional(),
});

export const OrganizationSignupSchema = z.object({
  orgName: z.string().min(1),
  adminName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  roleId: z.string().uuid().optional(),
});
