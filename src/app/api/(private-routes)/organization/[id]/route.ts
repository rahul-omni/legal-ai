import { userFromSession } from "@/lib/auth";
import { NextAuthRequest } from "next-auth";
import { NextResponse } from "next/server";
import { auth } from "../../../lib/auth/nextAuthConfig";
import { db } from "../../../lib/db";
import { handleError } from "../../../lib/errors";
import { logger } from "../../../lib/logger";

export const GET = auth(async function (request: NextAuthRequest, context) {
  try {
    logger.info("getOrganizationUsersController: Start processing request");

    const sessionUser = await userFromSession(request);
    logger.info(
      "getOrganizationUsersController: Retrieved session user",
      sessionUser
    );

    const { params } = await context;
    const { id: organizationId } = (await params) as { id: string };

    if (!organizationId) {
      logger.warn("getOrganizationUsersController: Missing organizationId");
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 }
      );
    }

    logger.info(
      "getOrganizationUsersController: Fetching users for organization",
      { organizationId }
    );
    const organizationUsers = await getOrganizationUsers(organizationId);
    logger.info(
      "getOrganizationUsersController: Retrieved organization users",
      { count: organizationUsers.length }
    );

    return NextResponse.json(
      organizationUsers.filter((user) => user.userId !== sessionUser.id)
    );
  } catch (error) {
    logger.error("getOrganizationUsersController: Error occurred", error);
    return handleError(error);
  }
});

// Helper function to get organization users
async function getOrganizationUsers(organizationId: string) {
  const memberships = await db.orgMembership.findMany({
    where: {
      orgId: organizationId,
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          mobileNumber: true,
          countryCode: true,
        },
      },
    },
  });
   console.log("getOrganizationUsers: memberships", memberships);
   
  return memberships;
}
