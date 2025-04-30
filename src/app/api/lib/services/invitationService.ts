import { db } from "@/lib/db";
import {
  generateVerificationToken,
  getTokenExpiry,
} from "../../lib/verificationTokens";
import { organizationService } from "./organizationService";
import { Invitation, InvitationStatus } from "@prisma/client";
import { InviteUserReq, InviteUserRes } from "../../invite-team-member/types";

class InvitationService {
  /**
   * Creates an invitation and retrieves the associated organization
   */
  async createInvitation(params: InviteUserReq): Promise<InviteUserRes> {
    try {
      const { email, orgId, roleId } = params;

      // Generate token for invitation
      const token = generateVerificationToken();
      const expiresAt = getTokenExpiry();

      // Check if invitation already exists updating the token and expiry date
      const existedInvitation = await this.checkInvitationExists(email, orgId);

      if (!!existedInvitation) {
        await this.updateInvitationToken(existedInvitation.id);
        return {
          successMessage: "Invitation already exists, token updated",
          email,
          token,
          orgId,
          roleId,
          status: existedInvitation.status,
        };
      }

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

  /**
   * Checks if an invitation exists for a given email and organization ID
   */
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

  async updateInvitationToken(invitationId: string): Promise<void> {
    const token = generateVerificationToken();
    const expiresAt = getTokenExpiry();
    try {
      await db.invitation.update({
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

  async updateInvitationStatus(invitationId: string, status: InvitationStatus) {
    return await db.invitation.update({
      where: { id: invitationId },
      data: { status },
    });
  }
}

// Export default instance for easier usage
export const invitationService = new InvitationService();
