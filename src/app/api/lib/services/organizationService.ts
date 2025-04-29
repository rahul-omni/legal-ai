import { db } from "@/lib/db";

class OrganizationService {
  /**
   * Fetches organization details by ID
   */
  async getOrganizationDetails(orgId: string) {
    try {
      const org = await db.organization.findFirst({
        where: { id: orgId },
        select: { name: true },
      });

      if (!org) {
        throw new Error(`Organization with ID ${orgId} not found`);
      }

      return org;
    } catch (error) {
      console.error("Failed to fetch organization details:", error);
      throw new Error("Failed to fetch organization details");
    }
  }
}

// Export default instance for easier usage
export const organizationService = new OrganizationService();
