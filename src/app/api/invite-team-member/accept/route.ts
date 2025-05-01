import { orgMembershipService } from "@/app/api/lib/services/orgMembershipService";
import { userService } from "@/app/api/lib/services/userService";
import { db } from "@/lib/db";
import { routeConfig } from "@/lib/routeConfig";
import { Invitation, User } from "@prisma/client";
import { NextRequest } from "next/server";
import { AppError, handleError } from "../../lib/errors";
import { logger } from "../../lib/logger";
import { redirectToURL } from "../../lib/redirect";
import { invitationService } from "../../lib/services/invitationTeamMemberService";
import { Transaction } from "../../types";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  logger.info(`Received GET request with URL: ${req.url}`);
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token") ?? "";
    const email = searchParams.get("email") ?? "";

    logger.info(`Extracted token: ${token}, email: ${email}`);

    logger.info(`Checking if user exists with email: ${email}`);
    const user = await userService.findUserByEmailWithPassword(email);

    if (user) {
      logger.info(`User found with email: ${email}, redirecting to login page`);
      return redirectSuccess(routeConfig.publicRoutes.login, email);
    }

    const existingAcceptedInvite = await checkExistingAcceptedInvitation(email);
    if (existingAcceptedInvite) {
      logger.info(`Existing accepted invitation found for email: ${email}`);
      return redirectSuccess(routeConfig.publicRoutes.createPassword, email);
    }

    const invite = await validateInvitationToken(token);

    const userEmail = await processInvitationAcceptance(invite);

    logger.info(`Redirecting to create password page for email: ${userEmail}`);
    cookies().set("verified", "true");
    return redirectSuccess(routeConfig.publicRoutes.createPassword, userEmail);
  } catch (error) {
    logger.error(`Error handling GET request`);
    return handleError(error);
  }
}

const redirectSuccess = (url: string, userEmail: string) => {
  cookies().set("verified", "true");
  return redirectToURL(url + `?email=${userEmail}`);
};

async function checkExistingAcceptedInvitation(email: string | undefined) {
  logger.info(`Checking existing accepted invitation for email: ${email}`);
  if (!email) return null;
  return await invitationService.findAcceptedInvitationByEmail(email);
}

async function validateInvitationToken(token: string | undefined) {
  logger.info(`Validating invitation token: ${token}`);
  if (!token) {
    throw new AppError("Invitation token is required");
  }

  const invite = await invitationService.findInvitationByToken(token);

  if (!invite) {
    throw new AppError("Invalid or expired invitation");
  }

  if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
    throw new AppError("Invitation has expired");
  }

  logger.info(`Invitation token validated successfully for token: ${token}`);
  return invite;
}

async function getOrCreateUser(invite: Invitation, tx: Transaction) {
  logger.info(`Getting or creating user for email: ${invite.email}`);
  const currentUser = await userService.findUserByEmail(invite.email);

  if (currentUser?.id) {
    logger.info(`User already exists with ID: ${currentUser.id}`);
    return currentUser.id;
  }

  const user = {
    email: invite.email,
    roleId: invite.roleId,
    isVerified: true,
    isIndividual: false,
  } as User;

  const createdUser = await userService.createUser(user, tx);
  logger.info(`User created with ID: ${createdUser.id}`);
  return createdUser.id;
}

async function processInvitationAcceptance(invite: Invitation) {
  logger.info(`Processing invitation acceptance for invite ID: ${invite.id}`);
  try {
    return await db.$transaction(async (tx) => {
      const userId = await getOrCreateUser(invite, tx);
      logger.info(`User ID for invitation: ${userId}`);

      await orgMembershipService.createOrgMembership(
        userId,
        invite.orgId,
        invite.roleId,
        tx
      );
      logger.info(`Organization membership created for user ID: ${userId}`);

      await invitationService.updateInvitationStatusToAccepted(invite.id, tx);
      logger.info(
        `Invitation status updated to accepted for invite ID: ${invite.id}`
      );

      return invite.email;
    });
  } catch (error) {
    logger.error(`Failed to process invitation`);
    throw new AppError("Failed to process invitation");
  }
}
