// lib/auth-options.ts
import { db } from "@/app/api/lib/db";
import bcrypt from "bcryptjs";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { logInSchema } from "../validation/authValidation";
import NextAuth from "next-auth";

const authOptions: NextAuthConfig = {
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const { email, password } = await logInSchema.parseAsync(credentials);

          const user = await db.user.findUnique({
            where: { email },
            include: { orgMemberships: { include: { org: true } } },
          });

          if (!user || !user.password) return null;

          const passwordMatch = await bcrypt.compare(password, user.password);
          if (!passwordMatch) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            memberships: user.orgMemberships.map((m) => ({
              organizationId: m.orgId,
              organizationName: m.org.name,
              roleId: m.roleId,
            })),
          };
        } catch (error) {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.memberships = (user as any).memberships || [];
      }
      return token;
    },
    session: ({ session, token }) => {
      if (token) {
        session.user.id = token.id as string;
        session.user.memberships = token.memberships as any;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export const nextAuthWithConfig = NextAuth(authOptions);
export const { auth } = nextAuthWithConfig;
