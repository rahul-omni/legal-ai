import { db } from "@/app/api/lib/db";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { logInSchema } from "@/app/api/lib/validation/authValidation";

/**
 * Validates organization (email/password) credentials and returns a clear error message.
 * Use this before calling signIn so the UI can show why login failed (e.g. wrong password, user not found).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = logInSchema.safeParse(body);

    if (!parsed.success) {
      const firstMessage = parsed.error.issues[0]?.message ?? "Invalid credentials.";
      return NextResponse.json(
        { success: false, message: firstMessage },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required." },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { success: false, message: "No account found with this email. Please sign up first." },
        { status: 401 }
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password." },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Validate credentials error:", e);
    return NextResponse.json(
      { success: false, message: "Login failed. Please try again." },
      { status: 500 }
    );
  }
}
