import { NextRequest, NextResponse } from "next/server";
import { userService } from "../lib/services/userService";
import { ErrorResponse } from "../types";
import { UserResponse } from "./types";

export async function GET(
  request: NextRequest
): Promise<NextResponse<UserResponse | ErrorResponse>> {
  try {
    const email = request.nextUrl.searchParams.get("email") || "";

    const data = await userService.findUserByEmailWithOrgs(email);
    const { orgMemberships, ...user } = data;
    return NextResponse.json(
      {
        user,
        orgMemberships: orgMemberships,
        successMessage: "User fetched successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        errorMessage: error?.message ?? "Failed to fetch users",
      },
      { status: 500 }
    );
  }
}
