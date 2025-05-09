import { db } from "@/app/api/lib/db";
import { Organization } from "@prisma/client";

class OrganizationService {
  /**
   * Fetches organization details by ID
   */
  async getOrganizationDetails(orgId: string): Promise<Organization> {
    try {
      const org = await db.organization.findFirst({
        where: { id: orgId },
      });

      if (!org) {
        throw new Error(`Organization with ID ${orgId} not found`);
      }

      return org;
    } catch {
      throw new Error("Failed to fetch organization details");
    }
  }
}

// Export default instance for easier usage
export const organizationService = new OrganizationService();
