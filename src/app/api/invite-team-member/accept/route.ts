import { orgMembershipService } from "@/app/api/lib/services/orgMembershipService";
import { userService } from "@/app/api/lib/services/userService";
import { NextRequest, NextResponse } from "next/server";
import { invitationService } from "../../lib/services/invitationService";
import { routeConfig } from "@/lib/routeConfig";
import { User } from "@prisma/client";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token") ?? undefined;

  const invite = await invitationService.findInvitationByToken(token!);

  if (!invite) {
    return NextResponse.json(
      { error: "Invalid or expired invitation" },
      { status: 400 }
    );
  }

  // TODO - need to check if the token is expired
  //TODO - need to update current user org membership if exists
  const currentUser = await userService.findUserByEmail(invite.email);

  let createdUser = null;

  if (!currentUser) {
    const user = {
      email: invite.email,
      isVerified: true,
      isIndividual: false,
      organizationId: invite.orgId,
    } as User;

    createdUser = await userService.createUser(user);
  }

  // TODO - already a member of the org check
  await orgMembershipService.createOrgMembership(
    currentUser?.id ?? createdUser?.id ?? "",
    invite.orgId,
    invite.roleId
  );

  // Update invite status
  await invitationService.updateInvitationStatusToAccepted(invite.id);

  // redirect to create password page

  const url = new URL(
    `${routeConfig.publicRoutes.createPassword}?email=${invite.email}`,
    req.url
  );

  // TODO: fail handling for redirect

  return NextResponse.redirect(url);
}
