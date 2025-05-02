import { db } from "@/lib/db";
import { User } from "@prisma/client";
import bcrypt from "bcryptjs";
import { addHours } from "date-fns";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  AuthError,
  ErrorResponse,
  ForbiddenError,
  handleError,
  NotFoundError,
} from "../../lib/errors";
import { generateJwdToken } from "../../lib/jsonWebToken";

interface LoginResponse {
  successMsg: string;
  user: Omit<User, "password">;
  token: string;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<LoginResponse | ErrorResponse>> {
  try {
    const { email, password } = await request.json();

    const userDetails = await db.user.findUnique({
      where: { email },
    });

    if (!userDetails) {
      console.warn("User not found for email:", email);
      throw new NotFoundError("User");
    }

    if (!userDetails?.isVerified) {
      throw new ForbiddenError("User not verified");
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      userDetails.password!
    );

    if (!isPasswordValid) {
      throw new AuthError();
    }

    const { password: _, ...user } = userDetails;

    const token = generateJwdToken({ user });

    cookies().set("authToken", token, {
      expires: addHours(new Date(), 24),
    });
    cookies().set("verified", "true");

    return NextResponse.json(
      { successMsg: "Login success", user, token },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error);
  }
}
