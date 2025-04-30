import { NextRequest, NextResponse } from "next/server";
import { orgMembershipService } from "@/app/api/lib/services/orgMembershipService";
import { userService } from "@/app/api/lib/services/userService";
import { invitationService } from "../../lib/services/invitationService";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token") ?? undefined;
  const email = searchParams.get("email") ?? undefined;
  const roleId = searchParams.get("role_id") ?? undefined;

  const invite = await invitationService.findInvitationByToken(token!);

  if (!invite) {
    return NextResponse.json(
      { error: "Invalid or expired invitation" },
      { status: 400 }
    );
  }

  const currentUser = await userService.findUserByEmail(invite.email);

  let createdUser = null;

  if (!currentUser) {
    createdUser = await userService.createUser(invite.email);
  }

  await orgMembershipService.createOrgMembership(
    currentUser?.id ?? createdUser?.id ?? "",
    invite.orgId,
    invite.roleId
  );

  // Update invite status
  await invitationService.updateInvitationStatus(invite.id, "ACCEPTED");

  return NextResponse.redirect("/dashboard");
}
