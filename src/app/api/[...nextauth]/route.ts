import { authOptions } from "@/app/api/lib/auth/nextAuthConfig";
import NextAuth from "next-auth";

const handler = NextAuth(authOptions);

export const {
  handlers: { GET, POST },
  auth,
} = handler;
