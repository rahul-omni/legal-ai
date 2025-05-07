import { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      memberships: Array<{
        organizationId: string;
        organizationName: string;
        roleId: string;
      }>;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    memberships?: Array<{
      organizationId: string;
      organizationName: string;
      roleId: string;
    }>;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    memberships: Array<{
      organizationId: string;
      organizationName: string;
      roleId: string;
    }>;
  }
}
