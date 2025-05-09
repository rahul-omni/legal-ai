import { ErrorResponse, handleError } from "@/app/api/lib/errors";
import { invitationService } from "@/app/api/services/invitationTeamMemberService";
import { NextRequest, NextResponse } from "next/server";
import { OrgTeamMemberRes } from "../../types";

export async function GET(
  _: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<OrgTeamMemberRes | ErrorResponse>> {
  try {
    const param = await params;
    const { id: orgId } = param;

    const invitations = await invitationService.organizationInvitations(orgId);

    return NextResponse.json({
      invitations,
      success: true,
      successMessage: "Fetched organization invitations successfully",
    });
  } catch (error) {
    console.error("Failed to fetch organization invitations:", error);
    return handleError(error);
  }
}
