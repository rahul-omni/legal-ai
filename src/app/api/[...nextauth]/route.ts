import { nextAuthWithConfig } from "@/app/api/lib/auth/nextAuthConfig";

export const {
  handlers: { GET, POST },
} = nextAuthWithConfig;
