import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

function handleError(error: unknown, message: string, status = 500) {
  console.error(message, error);
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
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
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isPasswordValid = await bcrypt.compare(password, userDetails.password);
    console.log("Password comparison result:", isPasswordValid);

    if (!isPasswordValid) {
      console.warn("Invalid password for user:", email);
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

    const token = `valid-token-${userDetails.id}`;
    console.log("Generated token:", token);

    // remove password from user object
    const { password: _, ...user } = userDetails;

    console.log("Login successful for user:", userDetails.id);
    return NextResponse.json(
      { message: "Login success", user, token },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error during login process:", error);
    return handleError(error, "Something went wrong.");
  }
}
