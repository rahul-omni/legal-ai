import { NextRequest, NextResponse } from "next/server";
import { ErrorResponse, handleError } from "../../lib/errors";
import { userService } from "../../services/userService";
import { UserResponse } from "./types";

export async function GET(
  request: NextRequest
): Promise<NextResponse<UserResponse | ErrorResponse>> {
  try {
    const email = request.nextUrl.searchParams.get("email") || "";

    const data = await userService.findUserByEmailWithOrgs(email);

    const { orgMemberships, ...user } = data!;
    return NextResponse.json(
      {
        user,
        orgMemberships: orgMemberships,
        success: true,
        successMessage: "User fetched successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error);
  }
}
