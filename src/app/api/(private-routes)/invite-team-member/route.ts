import { NextRequest, NextResponse } from "next/server";
import { ErrorResponse, handleError, ErrorValidation } from "../../lib/errors";
import { sendInviteEmail } from "../../lib/mail";
import { invitationService } from "../../services/invitationTeamMemberService";
import { InviteRequestSchema } from "../../lib/validation/inviteTeamMemberValidation";
import { SuccessResponse } from "../../types";

export async function POST(
  req: NextRequest
): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
  try {
    const body = await req.json();

    const validation = InviteRequestSchema.safeParse(body);
    if (!validation.success) {
      throw new ErrorValidation("Invalid request data");
    }

    // Use the service to handle database operations
    const invitationResult = await invitationService.createInvitation(
      validation.data
    );

    // Send invitation email
    await sendInviteEmail(
      invitationResult.token!,
      invitationResult.email,
      invitationResult.orgName!
    );

    return NextResponse.json(
      { ...invitationResult, successMessage: "Invitation sent successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in invite POST handler:", error);
    return handleError(error);
  }
}
