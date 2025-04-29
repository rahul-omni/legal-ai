import { db } from "@/lib/db";
import {
  generateVerificationToken,
  getTokenExpiry,
} from "../../lib/verificationTokens";

export interface InviteUserParams {
  email: string;
  orgId: string;
  roleId: string;
}

export interface InviteUserResult {
  email: string;
  token: string;
  orgId: string;
  orgName?: string;
  roleId: string;
}

/**
 * Creates an invitation and retrieves the associated organization
 */
export async function createInvitation(
  params: InviteUserParams
): Promise<InviteUserResult> {
  try {
    const { email, orgId, roleId } = params;

    // Generate token for invitation
    const token = generateVerificationToken();
    const expiresAt = getTokenExpiry();

    // Check if invitation already exists
    const existingInvitation = await db.invitation.findFirst({
      where: { email, orgId },
    });

    if (existingInvitation) {
      throw new Error(
        `An invitation for ${email} already exists for this organization`
      );
    }

    // Create the invitation
    const invitedUser = await db.invitation
      .create({
        data: { email, orgId, roleId, token, expiresAt },
        select: { email: true, token: true, orgId: true, roleId: true },
      })
      .catch((error) => {
        console.error("Failed to create invitation:", error);
        throw new Error("Failed to create invitation in the database");
      });

    // Get organization details
    const org = await db.organization
      .findFirst({
        where: { id: invitedUser.orgId },
        select: { name: true },
      })
      .catch((error) => {
        console.error("Failed to fetch organization details:", error);
        // Continue without org name as it's not critical
        throw new Error("Failed to fetch organization details");
      });

    return {
      ...invitedUser,
      orgName: org!.name,
    };
  } catch (error) {
    console.error("Invitation creation failed:", error);
    throw error instanceof Error
      ? error
      : new Error("An unexpected error occurred during invitation creation");
  }
}
