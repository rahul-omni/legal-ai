import { NextResponse } from "next/server";

/**
 * Mobile app logout: POST /api/auth/logout
 * The app uses JWT (verify-otp-mobile); there is no server session to destroy.
 * This route exists so the app's logout call does not hit the NextAuth catch-all
 * (which would throw UnknownAction for "logout").
 */
export async function POST() {
  return NextResponse.json({ success: true });
}
