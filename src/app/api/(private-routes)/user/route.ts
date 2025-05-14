import { NextRequest, NextResponse } from "next/server";
import { ErrorResponse, handleError } from "../../lib/errors";
import { userService } from "../../services/userService";
import { UserResponse } from "./types";

// export async function GET(
//   request: NextRequest
// ): Promise<NextResponse<UserResponse | ErrorResponse>> {
//   try {
//     const email = request.nextUrl.searchParams.get("email") || "";

//     const data = await userService.findUserByEmailWithOrgs(email);

//     const { orgMemberships, ...user } = data!;
//     return NextResponse.json(
//       {
//         user,
//         orgMemberships: orgMemberships,
//         success: true,
//         successMessage: "User fetched successfully",
//       },
//       { status: 200 }
//     );
//   } catch (error) {
//     return handleError(error);
//   }
// }



export async function GET(
  request: NextRequest
): Promise<NextResponse<UserResponse | ErrorResponse>> {
  try {
    const email = request.nextUrl.searchParams.get("email");
    const userId = request.nextUrl.searchParams.get("id");

    if (!email && !userId) {
      return NextResponse.json(
        { error: "Either email or ID must be provided" },
        { status: 400 }
      );
    }

    let data;
    if (email) {
      data = await userService.findUserByEmailWithOrgs(email);
    } else if (userId) {
      // Add this new method to your userService
      data = await userService.findUserByIdWithOrgs(userId);
    }

    if (!data) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const { orgMemberships, ...user } = data;
    return NextResponse.json(
      {
        user,
        orgMemberships,
        success: true,
        successMessage: "User fetched successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error);
  }
}
