import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import NextAuth, { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import { object, string } from "zod";
import { OrgMembershipForAuth } from "../types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      memberships: OrgMembershipForAuth[];
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    memberships?: OrgMembershipForAuth[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    memberships: OrgMembershipForAuth[];
  }
}

const signInSchema = object({
  email: string({ required_error: "Email is required" })
    .min(1, "Email is required")
    .email("Invalid email"),
  password: string({ required_error: "Password is required" })
    .min(1, "Password is required")
    .min(8, "Password must be more than 8 characters")
    .max(32, "Password must be less than 32 characters"),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  // Note: Credentials provider doesn't work with the Adapter
  // Using both can cause conflicts - comment out adapter when using Credentials
  // adapter: PrismaAdapter(db),
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        try {
          if (!credentials?.email || !credentials.password) {
            return null;
          }

          let user = null;

          const { email, password } =
            await signInSchema.parseAsync(credentials);

          user = await db.user.findUnique({
            where: { email: email },
            include: {
              orgMemberships: {
                include: {
                  org: true,
                },
              },
            },
          });

          if (!user) return null;

          const passwordMatch = await bcrypt.compare(password, user.password!);

          if (!passwordMatch) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            memberships: user.orgMemberships.map((membership) => ({
              organizationId: membership.orgId,
              organizationName: membership.org.name,
              roleId: membership.roleId,
            })),
          };
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email!;
        token.memberships = user.memberships || [];
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.memberships = token.memberships;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login", // Uncomment to redirect to your custom login page
    error: "/auth/error", // Uncomment for custom error page
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET || "YOUR_SECRET_SHOULD_BE_IN_ENV",
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
});

export { handlers as GET, handlers as POST };
