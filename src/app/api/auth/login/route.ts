import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { ErrorResponse } from "../types";
import { User } from "@prisma/client";
import { addHours } from "date-fns";

interface LoginResponse {
  successMsg: string;
  user: Omit<User, "password">;
  token: string;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<LoginResponse | ErrorResponse>> {
  try {
    console.log("Received login request");
    const { email, password } = await request.json();
    console.log("Parsed request body:", { email });

    const userDetails = await db.user.findUnique({
      where: { email },
    });
    console.log("Fetched user details:", userDetails);

    if (!userDetails) {
      console.warn("User not found for email:", email);
      return NextResponse.json({ errMsg: "User not found" }, { status: 404 });
    }

    if (!userDetails?.isVerified) {
      return NextResponse.json(
        { errMsg: "User not verified" },
        { status: 403 }
      );
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      userDetails.password
    );
    console.log("Password comparison result:", isPasswordValid);

    if (!isPasswordValid) {
      console.warn("Invalid password for user:", email);
      return NextResponse.json({ errMsg: "Invalid password" }, { status: 401 });
    }

    const token = `valid-token-${userDetails.id}`;
    console.log("Generated token:", token);

    const { password: _, ...user } = userDetails;

    console.log("Login successful for user:", userDetails.id);

    cookies().set("authToken", token, {
      expires: addHours(new Date(), 24),
    });

    return NextResponse.json(
      { successMsg: "Login success", user, token },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error during login process:", error);
    return NextResponse.json(
      { errMsg: "Something went wrong" },
      { status: 500 }
    );
  }
}
