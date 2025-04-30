import { NextRequest, NextResponse } from "next/server";
import { userService } from "../lib/services/userService";
import { ErrorResponse } from "../types";
import { UserResponse } from "./types";

export async function GET(
  request: NextRequest
): Promise<NextResponse<UserResponse | ErrorResponse>> {
  try {
    const email = request.nextUrl.searchParams.get("email") || "";
    // Fetch all users with their associated roles
    const user = await userService.findUserByEmail(email);

    // Return the users with their roles
    return NextResponse.json(
      { user, successMessage: "User fetched successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        errorMessage: "Failed to fetch users",
      },
      { status: 500 }
    );
  }
}
