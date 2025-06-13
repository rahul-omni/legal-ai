import { ErrorResponse, handleError } from "@/app/api/lib/errors";
import { invitationService } from "@/app/api/services/invitationTeamMemberService";
import { NextRequest, NextResponse } from "next/server";
import { OrgTeamMemberRes } from "../../types";

export async function GET(
  _: NextRequest,
  context: any
): Promise<NextResponse<OrgTeamMemberRes | ErrorResponse>> {
  try {
    const { params } = context;
    const { id: orgId } = params;

    const invitations = await invitationService.organizationInvitations(orgId);

    return NextResponse.json({
      invitations,
      success: true,
      successMessage: "Fetched organization invitations successfully",
    });
  } catch (error) {
    return handleError(error);
  }
}
