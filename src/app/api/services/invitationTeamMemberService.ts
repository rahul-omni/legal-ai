import { db } from "@/app/api/lib/db";
import { Invitation, InvitationStatus } from "@prisma/client";
import {
  InviteTeamMemberReq,
  InviteTeamMemberRes,
} from "../(private-routes)/invite-team-member/types";
import {
  generateVerificationToken,
  getTokenExpiry,
} from "../helper/verificationTokens";
import { ErrorNotFound } from "../lib/errors";
import { Transaction } from "../types";
import { organizationService } from "./organizationService";

class InvitationService {
  async organizationInvitations(orgId: string) {
    console.log('Received orgId:', orgId); // Verify the ID format
     

  if (!orgId) throw new Error("No orgId provided");
    try {

      const invitations = await db.invitation.findMany({
        where: { orgId },
      });
      console.log("Fetched invitations:", invitations);
      return invitations;
    } catch {
      throw new ErrorNotFound("Invitations Error in fetching invitations");
    }
  }

  async createInvitation(
    params: InviteTeamMemberReq
  ): Promise<InviteTeamMemberRes> {
    try {
      const { email, orgId, roleId } = params;

      // Check if invitation already exists updating the token and expiry date
      const existedInvitation = await this.checkInvitationExists(email, orgId);

      if (existedInvitation) {
        const invitation = await this.updateInvitationToken(
          existedInvitation.id
        );
        return {
          successMessage: "Invitation already exists, token updated",
          email,
          token: invitation.token!,
          orgId,
          roleId,
          status: existedInvitation.status,
        };
      }

      const token = generateVerificationToken();
      const expiresAt = getTokenExpiry();

      // Create the invitation
      const invitedUser = await db.invitation
        .create({
          data: {
            email,
            orgId,
            roleId,
            token,
            expiresAt,
            status: InvitationStatus.PENDING,
          },
          select: {
            email: true,
            token: true,
            orgId: true,
            roleId: true,
            status: true,
          },
        })
        .catch(() => {
          throw new Error("Failed to create invitation in the database");
        });

      // Get organization details using the organization service
      const org = await organizationService.getOrganizationDetails(
        invitedUser.orgId
      );

      return {
        ...invitedUser,
        successMessage: "Invitation created successfully",
        orgName: org.name,
      };
    } catch {
      throw new ErrorNotFound("Invitations");
    }
  }

  async checkInvitationExists(
    email: string,
    orgId: string
  ): Promise<Invitation | null> {
    try {
      const invitation = await db.invitation.findFirst({
        where: { email, orgId },
      });
      return invitation;
    } catch {
      throw new Error("Failed to check invitation existence in the database");
    }
  }

  async updateInvitationToken(invitationId: string): Promise<Invitation> {
    const token = generateVerificationToken();
    const expiresAt = getTokenExpiry();
    try {
      return await db.invitation.update({
        where: { id: invitationId },
        data: { token, expiresAt },
      });
    } catch {
      throw new Error("Failed to update invitation token in the database");
    }
  }

  async findInvitationByToken(token: string) {
    return await db.invitation.findUnique({
      where: { token, expiresAt: { gt: new Date() } },
    });
  }

  async updateInvitationStatusToAccepted(
    invitationId: string,
    tx?: Transaction
  ) {
    const prisma = tx || db;
    try {
      const updatedInvitation = await prisma.invitation.update({
        where: { id: invitationId },
        data: {
          status: InvitationStatus.ACCEPTED,
          token: null,
          expiresAt: null,
        },
      });
      return updatedInvitation;
    } catch {
      throw new Error("Failed to update invitation status in the database");
    }
  }

  async findAcceptedInvitationByEmail(email: string) {
    try {
      return await db.invitation.findFirst({
        where: {
          email,
          status: InvitationStatus.ACCEPTED,
        },
      });
    } catch {
      throw new Error("Failed to find accepted invitation in the database");
    }
  }
}

export const invitationService = new InvitationService();
