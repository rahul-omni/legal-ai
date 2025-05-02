import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { logger } from "../../../lib/logger";
import { sendVerificationEmail } from "../../../lib/mail";
import {
  generateVerificationToken,
  getTokenExpiry,
} from "../../../lib/verificationTokens";
import {
  ErrorResponse,
  IndividualSignupRequest,
  IndividualSignupResponse,
} from "../types";

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
      return NextResponse.json(
        { errMsg: "User already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Default to ASSISTANT role if not specified
    const defaultRole = await db.role.findUnique({
      where: { name: "ASSISTANT" },
      select: { id: true },
    });

    if (!roleId && !defaultRole) {
      logger.error("No default role configured");
      return NextResponse.json(
        { errMsg: "No default role configured" },
        { status: 400 }
      );
    }

    const verificationToken = generateVerificationToken();

    logger.info("Verification token generated", { verificationToken });

    const tokenExpiry = getTokenExpiry();

    // Create user
    const user = await db.user.create({
      data: {
        name,
        email,
        verificationToken,
        verificationTokenExpiry: tokenExpiry,
        password: hashedPassword,
        isVerified: false,
        roleId: roleId || defaultRole?.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        isVerified: true,
        roleId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    logger.info("User created successfully", { userId: user.id });

    await sendVerificationEmail(email, verificationToken);

    return NextResponse.json(
      {
        user,
        errMsg: "User created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error("Signup error", { error: error });
    return NextResponse.json(
      { errMsg: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
    logger.info("Database connection closed");
  }
}
