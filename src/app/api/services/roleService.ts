import { db } from "@/app/api/lib/db";

class RoleService {
  /**
   * Finds all roles with their permissions
   */
  async findAllRoles() {
    try {
      const roles = await db.role.findMany({
        include: {
          permission: true,
        },
      });
      return roles;
    } catch {
      throw new Error("Failed to fetch roles from the database");
    }
  }
}

// Export default instance for easier usage
export const roleService = new RoleService();
