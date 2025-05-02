import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  ErrorResponse,
  handleError,
  NotFoundError,
  ValidationError,
} from "../../../lib/errors";
import { logger } from "../../../lib/logger";
import { userService } from "../../../lib/services/userService";
import { CreatePasswordResponse } from "../types";

const CreatePasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

export async function POST(
  request: NextRequest
): Promise<NextResponse<CreatePasswordResponse | ErrorResponse>> {
  logger.info("Received create password request");
  try {
    const requestData = await request.json();

    const validation = CreatePasswordSchema.safeParse(requestData);
    if (!validation.success) {
      throw new ValidationError("Invalid request data");
    }

    const { email, password } = validation.data;

    logger.info(`Processing create password for email: ${email}`);

    const userDetails = await userService.findUserByEmail(email);

    if (!userDetails) {
      logger.warn(`User not found for email: ${email}`);
      throw new NotFoundError("User");
    }

    if (userDetails.password) {
      logger.warn(`Password already set for user: ${email}`);
      const { password: _, ...user } = userDetails;
      return NextResponse.json({
        success: true,
        message: "Password already set",
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user with password
    await userService.updateUserById({
      ...userDetails,
      password: hashedPassword,
    });

    logger.info(`Password created successfully for user: ${email}`);

    return NextResponse.json({
      success: true,
      message: "Password created successfully",
    });
  } catch (error) {
    logger.error("Error creating password");
    return handleError(error);
  }
}
