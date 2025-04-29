import { db } from "@/lib/db";

class OrgMembershipService {
  /**
   * Creates an organization membership
   */
  async createOrgMembership(userId: string, orgId: string, roleId: string) {
    try {
      return await db.orgMembership.create({
        data: {
          userId,
          orgId,
          roleId,
        },
      });
    } catch (error) {
      console.error("Failed to create organization membership:", error);
      throw error instanceof Error
        ? error
        : new Error("Failed to create organization membership in the database");
    }
  }

  /**
   * Finds organization memberships by user ID
   */
  async findMembershipsByUserId(userId: string) {
    try {
      return await db.orgMembership.findMany({
        where: { userId },
        include: {
          org: true,
          user: true,
        },
      });
    } catch (error) {
      console.error("Failed to fetch user memberships:", error);
      throw new Error("Failed to fetch user memberships from the database");
    }
  }
}

// Export default instance for easier usage
export const orgMembershipService = new OrgMembershipService();
