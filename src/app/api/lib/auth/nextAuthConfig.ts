import { db } from "@/app/api/lib/db";
import bcrypt from "bcryptjs";
import type { NextAuthConfig } from "next-auth";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import z from "zod";
// import Credentials from "next-auth/providers/credentials";
import { logInSchema } from "../validation/authValidation";

const authOptions: NextAuthConfig = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        mobileNumber: { label: "Mobile Number", type: "text" },
        otp: { label: "OTP", type: "text" },
      },
      async authorize(credentials) {
        console.log("Received credentials:", credentials);

        try {
          console.log("Parsing credentials with logInSchema", credentials);

          // const { email, password,  } = await emailPasswordSchema.parseAsync(credentials);

          //onst { email, password, mobileNumber, otp } = credentials || {};
          const parsed = logInSchema.parse(credentials);

          const { email, password, mobileNumber, otp } = parsed;

          // 1. Handle email/password login
          if (email && password) {
            //onst parsed = emailPasswordSchema.parse({ email, password });
            const user = await db.user.findUnique({
              where: { email: email },
              include: { orgMemberships: { include: { org: true } } },
            });

            if (!user || !user.password) return null;

            const passwordMatch = await bcrypt.compare(password, user.password);
            if (!passwordMatch) return null;

            return {
              id: user.id,
              email: user.email,
              name: user.name,
              mobileNumber: user.mobileNumber,
              memberships: user.orgMemberships.map((m) => ({
                organizationId: m.orgId,
                organizationName: m.org.name,
                roleId: m.roleId,
              })),
            };
          }

          // 2. Handle OTP-based login
          if (mobileNumber && otp) {
            //onst parsed = otpSchema.parse({ mobileNumber, otp });
            const otpRecord = await db.individualOtpLogin.findUnique({
              where: { mobileNumber },
              include: { user: true },
            });

            if (!otpRecord || otpRecord.status !== "VERIFIED") {
              console.log("OTP login failed:", {
                otpRecord,
                expectedOtp: parsed.otp,
              });
              return null;
            }

            const user = otpRecord.user;

            return {
              id: user.id,
              email: user.email,
              name: user.name,
              mobileNumber: user.mobileNumber,

              
            };
          }

          return null;
        } catch (error) {
          console.error("Authorize error:", error);
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
        token.mobileNumber = user.mobileNumber || "";
      }
      return token;
    },
    session: ({ session, token }) => {
      if (token) {
        session.user.id = token.id as string;
        session.user.memberships = token.memberships as any;
        session.user.mobileNumber = token.mobileNumber as string;
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
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export const nextAuthWithConfig = NextAuth(authOptions);
export const { auth } = nextAuthWithConfig;
