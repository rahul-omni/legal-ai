import { db } from "@/lib/db";
import { Invitation, InvitationStatus } from "@prisma/client";
import {
  InviteTeamMemberReq,
  InviteTeamMemberRes,
} from "../../(private-routes)/invite-team-member/types";
import { Transaction } from "../../types";
import { ErrorNotFound } from "../errors";
import {
  generateVerificationToken,
  getTokenExpiry,
} from "../verificationTokens";
import { organizationService } from "./organizationService";

class InvitationService {
  async organizationInvitations(orgId: string) {
    try {
      const invitations = await db.invitation.findMany({
        where: { orgId },
      });
      return invitations;
    } catch (error) {
      console.error("Failed to fetch organization invitations:", error);
      throw new ErrorNotFound("Invitations");
    }
  }

  async createInvitation(
    params: InviteTeamMemberReq
  ): Promise<InviteTeamMemberRes> {
    try {
      const { email, orgId, roleId } = params;

      // Check if invitation already exists updating the token and expiry date
      const existedInvitation = await this.checkInvitationExists(email, orgId);

      if (!!existedInvitation) {
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
        .catch((error) => {
          console.error("Failed to create invitation:", error);
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
    } catch (error) {
      console.error("Invitation creation failed:", error);
      throw error instanceof Error
        ? error
        : new Error("An unexpected error occurred during invitation creation");
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
    } catch (error) {
      console.error("Failed to check invitation existence:", error);
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
    } catch (error) {
      console.error("Failed to update invitation token:", error);
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
    console.log("Updating invitation status to ACCEPTED for ID:", invitationId);
    try {
      const updatedInvitation = await prisma.invitation.update({
        where: { id: invitationId },
        data: {
          status: InvitationStatus.ACCEPTED,
          token: null,
          expiresAt: null,
        },
      });
      console.log("Invitation status updated successfully:", updatedInvitation);
      return updatedInvitation;
    } catch (error) {
      console.error(
        "Failed to update invitation status to ACCEPTED for ID:",
        invitationId,
        error
      );
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
    } catch (error) {
      console.error("Failed to find accepted invitation by email:", error);
      throw new Error("Failed to find accepted invitation in the database");
    }
  }
}

export const invitationService = new InvitationService();
