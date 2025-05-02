import {
  ErrorAlreadyExists,
  ErrorResponse,
  handleError,
} from "@/app/api/lib/errors";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { logger } from "../../../lib/logger";
import { sendVerificationEmail } from "../../../lib/mail";
import {
  generateVerificationToken,
  getTokenExpiry,
} from "../../../lib/verificationTokens";
import { IndividualSignupRequest, IndividualSignupResponse } from "../types";

export default async function handler(
  data: IndividualSignupRequest
): Promise<NextResponse<IndividualSignupResponse | ErrorResponse>> {
  try {
    const { name, email, password, roleId } = data;

    logger.info("Signup request received", { email });

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      logger.warn("User already exists", { email });
      throw new ErrorAlreadyExists("User");
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const verificationToken = generateVerificationToken();

    logger.info("Verification token generated", { verificationToken });

    const tokenExpiry = getTokenExpiry();

    const user = await db.user.create({
      data: {
        name,
        email,
        verificationToken,
        verificationTokenExpiry: tokenExpiry,
        password: hashedPassword,
        isVerified: false,
      },
    });

    logger.info("User created successfully", { userId: user.id });

    await sendVerificationEmail(email, verificationToken);

    const { password: _, ...userDetails } = user;
    return NextResponse.json(
      {
        user: userDetails,
        message: "User created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error("Signup error", { error: error });
    return handleError(error);
  }
}
