import { z } from "zod";

// Define request validation schema
export const InviteRequestSchema = z.object({
  email: z.string().email(),
  orgId: z.string().uuid(),
  roleId: z.string().uuid(),
});
