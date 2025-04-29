import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { sendVerificationEmail } from "../../lib/mail";
import { generateVerificationToken, getTokenExpiry } from "../../lib/verificationTokens";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    const user = await db.user.findUnique({
      where: { email },
      select: { isVerified: true },
    });

    if (user?.isVerified) {
      return NextResponse.json(
        { message: "Email already verified" },
        { status: 400 }
      );
    }

    const verificationToken = generateVerificationToken();
    const tokenExpiry = getTokenExpiry();

    await db.user.update({
      where: { email },
      data: {
        verificationToken,
        verificationTokenExpiry: tokenExpiry,
      },
    });

    await sendVerificationEmail(email, verificationToken);

    return NextResponse.json(
      { message: "Verification email resent" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
