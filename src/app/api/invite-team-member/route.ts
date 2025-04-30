import { NextRequest, NextResponse } from "next/server";
import { sendInviteEmail } from "../lib/mail";
import { invitationService } from "../lib/services/invitationService";
import { InviteRequestSchema } from "../lib/validation/inviteTeamMember";
import { ErrorResponse, SuccessResponse } from "../types";

export async function POST(
  req: NextRequest
): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
  try {
    const body = await req.json();

    const validation = InviteRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          errorMessage: "Invalid request data",
          errors: validation.error.errors,
        },
        { status: 400 }
      );
    }

    // Use the service to handle database operations
    const invitationResult = await invitationService.createInvitation(
      validation.data
    );

    // Send invitation email
    sendInviteEmail(
      invitationResult.email,
      invitationResult.token,
      invitationResult.orgName!,
      invitationResult.roleId
    );

    return NextResponse.json(
      { ...invitationResult, successMessage: "Invitation sent successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in invite POST handler:", error);
    return NextResponse.json(
      { errorMessage: "Internal server error" },
      { status: 500 }
    );
  }
}
